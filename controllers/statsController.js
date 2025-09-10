const Progresso = require('../models/Progress');
const Habito = require('../models/Habit');
const Usuario = require('../models/User');

exports.sistema = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalHabitos = await Habito.countDocuments();
    const totalProgressos = await Progresso.countDocuments();
    const progressosConcluidos = await Progresso.countDocuments({ status: 'concluido' });
    res.json({
      sucesso: true,
      estatisticasSistema: {
        totalUsuarios,
        totalHabitos,
        totalProgressos,
        progressosConcluidos,
        taxaConclusaoGeral: totalProgressos > 0 ? Math.round((progressosConcluidos / totalProgressos) * 100) : 0
      }
    });
  } catch (erro) {
    console.error('Erro ao carregar estatísticas do sistema:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível carregar as estatísticas do sistema...' });
  }
};

exports.graficoSemanal = async (req, res) => {
  try {
    const {usuario} = req;
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    seteDiasAtras.setHours(0, 0, 0, 0);
    const progressos = await Progresso.find({ idUsuario: usuario._id, data: { $gte: seteDiasAtras } }).populate('idHabito');
    const dadosPorDia = {};
    for (let i = 0; i < 7; i++) {
      const data = new Date(seteDiasAtras);
      data.setDate(seteDiasAtras.getDate() + i);
      const dataString = data.toISOString().split('T')[0];
      dadosPorDia[dataString] = { data: dataString, concluidos: 0, perdidos: 0, experiencia: 0, habitos: [] };
    }
    progressos.forEach(progresso => {
      const dataString = progresso.data.toISOString().split('T')[0];
      if (dadosPorDia[dataString]) {
        if (progresso.status === 'concluido') {
          dadosPorDia[dataString].concluidos++;
          dadosPorDia[dataString].experiencia += progresso.experienciaGanha;
        } else if (progresso.status === 'perdido') {
          dadosPorDia[dataString].perdidos++;
        }
        dadosPorDia[dataString].habitos.push({ titulo: progresso.idHabito.titulo, status: progresso.status, experiencia: progresso.experienciaGanha });
      }
    });
    res.json({ sucesso: true, mensagem: '📊 Gráfico semanal gerado', graficoSemanal: Object.values(dadosPorDia) });
  } catch (erro) {
    console.error('Erro ao gerar gráfico semanal:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível gerar o gráfico semanal...' });
  }
};

exports.categorias = async (req, res) => {
  try {
    const {usuario} = req;
    const { periodo = '30' } = req.query;
    const diasAtras = parseInt(periodo);
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - diasAtras);
    const progressos = await Progresso.find({ idUsuario: usuario._id, data: { $gte: dataInicio } }).populate('idHabito');
    const estatisticasPorCategoria = {};
    progressos.forEach(progresso => {
      const {categoria} = progresso.idHabito;
      if (!estatisticasPorCategoria[categoria]) {
        estatisticasPorCategoria[categoria] = { categoria, total: 0, concluidos: 0, perdidos: 0, experienciaTotal: 0, habitos: new Set() };
      }
      estatisticasPorCategoria[categoria].total++;
      estatisticasPorCategoria[categoria].habitos.add(progresso.idHabito.titulo);
      if (progresso.status === 'concluido') {
        estatisticasPorCategoria[categoria].concluidos++;
        estatisticasPorCategoria[categoria].experienciaTotal += progresso.experienciaGanha;
      } else if (progresso.status === 'perdido') {
        estatisticasPorCategoria[categoria].perdidos++;
      }
    });
    const resultado = Object.values(estatisticasPorCategoria).map(cat => ({
      categoria: cat.categoria,
      total: cat.total,
      concluidos: cat.concluidos,
      perdidos: cat.perdidos,
      experienciaTotal: cat.experienciaTotal,
      taxaConclusao: cat.total > 0 ? Math.round((cat.concluidos / cat.total) * 100) : 0,
      habitosUnicos: Array.from(cat.habitos),
      quantidadeHabitos: cat.habitos.size
    }));
    res.json({ sucesso: true, mensagem: `📈 Estatísticas por categoria (${periodo} dias)`, estatisticasCategorias: resultado });
  } catch (erro) {
    console.error('Erro ao gerar estatísticas por categoria:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível gerar estatísticas por categoria...' });
  }
};

exports.heatmap = async (req, res) => {
  try {
    const {usuario} = req;
    const { ano = new Date().getFullYear() } = req.query;
    const inicioAno = new Date(ano, 0, 1);
    const fimAno = new Date(ano, 11, 31, 23, 59, 59);
    const progressos = await Progresso.find({ idUsuario: usuario._id, data: { $gte: inicioAno, $lte: fimAno }, status: 'concluido' });
    const atividadesPorDia = {};
    progressos.forEach(progresso => {
      const dataString = progresso.data.toISOString().split('T')[0];
      if (!atividadesPorDia[dataString]) {
        atividadesPorDia[dataString] = { data: dataString, quantidade: 0, experiencia: 0 };
      }
      atividadesPorDia[dataString].quantidade++;
      atividadesPorDia[dataString].experiencia += progresso.experienciaGanha;
    });
    const valores = Object.values(atividadesPorDia).map(dia => dia.quantidade);
    const maxAtividades = Math.max(...valores, 1);
    const heatmapData = Object.values(atividadesPorDia).map(dia => ({ ...dia, nivel: Math.min(4, Math.ceil((dia.quantidade / maxAtividades) * 4)) }));
    res.json({ sucesso: true, mensagem: `🔥 Heatmap de atividades para ${ano}`, heatmap: { ano: parseInt(ano), dados: heatmapData, resumo: { diasAtivos: heatmapData.length, totalAtividades: valores.reduce((a, b) => a + b, 0), maxAtividadesDia: maxAtividades, experienciaTotal: Object.values(atividadesPorDia).reduce((total, dia) => total + dia.experiencia, 0) } } });
  } catch (erro) {
    console.error('Erro ao gerar heatmap:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível gerar o heatmap...' });
  }
};

exports.comparativoMensal = async (req, res) => {
  try {
    const {usuario} = req;
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const estatisticasMensais = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(anoAtual, mesAtual - i, 1);
      const inicioMes = new Date(data.getFullYear(), data.getMonth(), 1);
      const fimMes = new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59);
      const progressosMes = await Progresso.find({ idUsuario: usuario._id, data: { $gte: inicioMes, $lte: fimMes } });
      const concluidos = progressosMes.filter(p => p.status === 'concluido').length;
      const experiencia = progressosMes.reduce((total, p) => total + p.experienciaGanha, 0);
      estatisticasMensais.push({ mes: data.getMonth() + 1, ano: data.getFullYear(), nomeMs: data.toLocaleDateString('pt-BR', { month: 'long' }), totalProgressos: progressosMes.length, concluidos, perdidos: progressosMes.filter(p => p.status === 'perdido').length, experienciaTotal: experiencia, taxaConclusao: progressosMes.length > 0 ? Math.round((concluidos / progressosMes.length) * 100) : 0 });
    }
    res.json({ sucesso: true, mensagem: '📅 Comparativo dos últimos 6 meses', comparativoMensal: estatisticasMensais });
  } catch (erro) {
    console.error('Erro ao gerar comparativo mensal:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: '💀 Não foi possível gerar o comparativo mensal...' });
  }
};



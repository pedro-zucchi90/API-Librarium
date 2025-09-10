const Usuario = require('../models/User');
const Habito = require('../models/Habit');
const Progresso = require('../models/Progress');
const Conquista = require('../models/Achievement');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class AchievementService {
  // Verificar e desbloquear conquistas para um usuário
  static async verificarConquistas (usuarioId) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {return []};

      const conquistasDesbloqueadas = [];

      // Buscar todas as conquistas disponíveis
      const conquistasDisponiveis = await Conquista.find({
        idUsuario: usuarioId,
        desbloqueadaEm: { $exists: false } // Ainda não desbloqueada
      });

      for (const conquista of conquistasDisponiveis) {
        if (await this.verificarCondicoesConquista(conquista, usuario)) {
          const conquistaDesbloqueada = await this.desbloquearConquista(conquista, usuario);
          conquistasDesbloqueadas.push(conquistaDesbloqueada);
        }
      }

      return conquistasDesbloqueadas;
    } catch (erro) {
      console.error('Erro ao verificar conquistas:', erro);
      throw erro;
    }
  }

  // Verificar se uma conquista específica deve ser desbloqueada
  static async verificarCondicoesConquista (conquista, usuario) {
    try {
      const { tipo, valor, periodo } = conquista.condicoes;

      switch (tipo) {
      case 'sequencia': {
        const resultado = await this.verificarSequencia(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'nivel':
        return usuario.nivel >= valor;

      case 'habitos_concluidos': {
        const resultado = await this.verificarHabitosConcluidos(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'dias_ativo': {
        const resultado = await this.verificarDiasAtivo(usuario, valor);
        return resultado >= valor;
      }

      case 'xp_total':
        return usuario.experiencia >= valor;

      case 'habitos_categoria': {
        const resultado = await this.verificarHabitosCategoria(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'sequencia_perfeita': {
        const resultado = await this.verificarSequenciaPerfeita(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'habitos_diferentes': {
        const resultado = await this.verificarHabitosDiferentes(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'eficiencia_semanal': {
        const resultado = await this.verificarEficienciaSemanal(usuario, valor);
        return resultado >= valor;
      }

      case 'consistencia_mensal': {
        const resultado = await this.verificarConsistenciaMensal(usuario, valor);
        return resultado >= valor;
      }

      case 'habitos_rapidos': {
        const resultado = await this.verificarHabitosRapidos(usuario, valor, periodo);
        return resultado >= valor;
      }

      case 'variedade_categorias': {
        const resultado = await this.verificarVariedadeCategorias(usuario, valor);
        return resultado >= valor;
      }

      default:
        return false;
      }
    } catch (erro) {
      console.error('Erro ao verificar condições da conquista:', erro);
      return false;
    }
  }

  // Verificar sequência de dias consecutivos
  static async verificarSequencia (usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      const progressos = await Progresso.find({
        idUsuario: usuario._id,
        data: { $gte: dataInicio },
        status: 'concluido'
      }).sort({ data: 1 });

      if (progressos.length === 0) {return false};

      let sequenciaAtual = 1;
      let maiorSequencia = 1;

      for (let i = 1; i < progressos.length; i++) {
        const dataAtual = progressos[i].data;
        const dataAnterior = progressos[i - 1].data;
        const diffDias = Math.floor((dataAtual - dataAnterior) / (1000 * 60 * 60 * 24));

        if (diffDias === 1) {
          sequenciaAtual++;
          maiorSequencia = Math.max(maiorSequencia, sequenciaAtual);
        } else {
          sequenciaAtual = 1;
        }
      }

      return maiorSequencia >= valor;
    } catch (erro) {
      console.error('Erro ao verificar sequência:', erro);
      return false;
    }
  }

  // Verificar total de hábitos concluídos
  static async verificarHabitosConcluidos (usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      const totalConcluidos = await Progresso.countDocuments({
        idUsuario: usuario._id,
        data: { $gte: dataInicio },
        status: 'concluido'
      });

      return totalConcluidos >= valor;
    } catch (erro) {
      console.error('Erro ao verificar hábitos concluídos:', erro);
      return false;
    }
  }

  // Verificar dias ativo (com pelo menos um hábito concluído)
  static async verificarDiasAtivo (usuario, valor) {
    try {
      const diasAtivo = await Progresso.distinct('data', {
        idUsuario: usuario._id,
        status: 'concluido'
      });

      return diasAtivo.length >= valor;
    } catch (erro) {
      console.error('Erro ao verificar dias ativo:', erro);
      return false;
    }
  }

  // Verificar hábitos por categoria
  static async verificarHabitosCategoria (usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      const habitosPorCategoria = await Progresso.aggregate([
        {
          $match: {
            idUsuario: usuario._id,
            data: { $gte: dataInicio },
            status: 'concluido'
          }
        },
        {
          $lookup: {
            from: 'habitos',
            localField: 'idHabito',
            foreignField: '_id',
            as: 'habito'
          }
        },
        {
          $unwind: '$habito'
        },
        {
          $group: {
            _id: '$habito.categoria',
            total: { $sum: 1 }
          }
        },
        {
          $match: {
            total: { $gte: valor }
          }
        }
      ]);

      return habitosPorCategoria.length > 0;
    } catch (erro) {
      console.error('Erro ao verificar hábitos por categoria:', erro);
      return false;
    }
  }

  // Verificar sequência perfeita (todos os hábitos do dia)
  static async verificarSequenciaPerfeita (usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      // Buscar todos os hábitos ativos do usuário
      const habitosAtivos = await Habito.countDocuments({
        idUsuario: usuario._id,
        ativo: true
      });

      if (habitosAtivos === 0) {return false};

      // Buscar dias com todos os hábitos concluídos
      const diasPerfeitos = await Progresso.aggregate([
        {
          $match: {
            idUsuario: usuario._id,
            data: { $gte: dataInicio },
            status: 'concluido'
          }
        },
        {
          $group: {
            _id: '$data',
            habitosConcluidos: { $sum: 1 }
          }
        },
        {
          $match: {
            habitosConcluidos: { $gte: habitosAtivos }
          }
        }
      ]);

      return diasPerfeitos.length >= valor;
    } catch (erro) {
      console.error('Erro ao verificar sequência perfeita:', erro);
      return false;
    }
  }

  // Verificar hábitos diferentes completados
  static async verificarHabitosDiferentes(usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      const habitosDiferentes = await Progresso.distinct('idHabito', {
        idUsuario: usuario._id,
        data: { $gte: dataInicio },
        status: 'concluido'
      });

      return habitosDiferentes.length >= valor;
    } catch (erro) {
      console.error('Erro ao verificar hábitos diferentes:', erro);
      return false;
    }
  }

  // Verificar eficiência semanal (porcentagem de hábitos concluídos)
  static async verificarEficienciaSemanal(usuario, valor) {
    try {
      const dataInicio = this.calcularDataInicio('semanal');
      const dataFim = new Date();

      // Buscar todos os hábitos ativos na semana
      const habitosAtivos = await Habito.countDocuments({
        idUsuario: usuario._id,
        ativo: true
      });

      if (habitosAtivos === 0) {return 0};

      // Buscar hábitos concluídos na semana
      const habitosConcluidos = await Progresso.countDocuments({
        idUsuario: usuario._id,
        data: { $gte: dataInicio, $lte: dataFim },
        status: 'concluido'
      });

      // Calcular eficiência (hábitos concluídos / total de hábitos * 7 dias)
      const eficiencia = (habitosConcluidos / (habitosAtivos * 7)) * 100;
      return Math.round(eficiencia);
    } catch (erro) {
      console.error('Erro ao verificar eficiência semanal:', erro);
      return 0;
    }
  }

  // Verificar consistência mensal (dias com pelo menos um hábito)
  static async verificarConsistenciaMensal(usuario, valor) {
    try {
      const dataInicio = this.calcularDataInicio('mensal');
      const dataFim = new Date();

      const diasComHabitos = await Progresso.distinct('data', {
        idUsuario: usuario._id,
        data: { $gte: dataInicio, $lte: dataFim },
        status: 'concluido'
      });

      const totalDias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24));
      const consistencia = (diasComHabitos.length / totalDias) * 100;

      return Math.round(consistencia);
    } catch (erro) {
      console.error('Erro ao verificar consistência mensal:', erro);
      return 0;
    }
  }

  // Verificar hábitos rápidos (concluídos no mesmo dia)
  static async verificarHabitosRapidos(usuario, valor, periodo) {
    try {
      const dataInicio = this.calcularDataInicio(periodo);

      const habitosRapidos = await Progresso.aggregate([
        {
          $match: {
            idUsuario: usuario._id,
            data: { $gte: dataInicio },
            status: 'concluido'
          }
        },
        {
          $lookup: {
            from: 'habitos',
            localField: 'idHabito',
            foreignField: '_id',
            as: 'habito'
          }
        },
        {
          $unwind: '$habito'
        },
        {
          $match: {
            'habito.frequencia': 'diario'
          }
        },
        {
          $group: {
            _id: '$data',
            habitosConcluidos: { $sum: 1 }
          }
        },
        {
          $match: {
            habitosConcluidos: { $gte: valor }
          }
        }
      ]);

      return habitosRapidos.length;
    } catch (erro) {
      console.error('Erro ao verificar hábitos rápidos:', erro);
      return 0;
    }
  }

  // Verificar variedade de categorias
  static async verificarVariedadeCategorias(usuario, valor) {
    try {
      const dataInicio = this.calcularDataInicio('total');

      const categorias = await Progresso.aggregate([
        {
          $match: {
            idUsuario: usuario._id,
            data: { $gte: dataInicio },
            status: 'concluido'
          }
        },
        {
          $lookup: {
            from: 'habitos',
            localField: 'idHabito',
            foreignField: '_id',
            as: 'habito'
          }
        },
        {
          $unwind: '$habito'
        },
        {
          $group: {
            _id: '$habito.categoria'
          }
        }
      ]);

      return categorias.length >= valor;
    } catch (erro) {
      console.error('Erro ao verificar variedade de categorias:', erro);
      return false;
    }
  }

  // Calcular data de início baseada no período
  static calcularDataInicio (periodo) {
    const hoje = new Date();

    switch (periodo) {
    case 'diario':
      return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    case 'semanal':
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      return inicioSemana;

    case 'mensal':
      return new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    case 'total':
      return new Date(0); // Desde o início dos tempos

    default:
      return new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    }
  }

  // Desbloquear uma conquista
  static async desbloquearConquista (conquista, usuario) {
    try {
      // Marcar como desbloqueada
      conquista.desbloqueadaEm = new Date();
      await conquista.save();

      // Adicionar XP ao usuário
      const xpAnterior = usuario.experiencia;
      await usuario.adicionarExperiencia(conquista.experienciaRecompensa);
      const xpNovo = usuario.experiencia;

      // Verificar se subiu de nível
      const nivelAnterior = Math.floor(xpAnterior / 100) + 1;
      const nivelNovo = Math.floor(xpNovo / 100) + 1;

      // Criar notificação
      const notificacao = Notificacao.criarConquista(usuario._id, conquista);
      await notificacao.save();

      // Se subiu de nível, criar notificação adicional
      if (nivelNovo > nivelAnterior) {
        const tituloNovo = this.obterTituloPorNivel(nivelNovo);
        const notificacaoNivel = Notificacao.criarNivel(usuario._id, nivelAnterior, nivelNovo, tituloNovo);
        await notificacaoNivel.save();
      }

      return {
        conquista,
        xpGanho: conquista.experienciaRecompensa,
        nivelAnterior,
        nivelNovo,
        subiuNivel: nivelNovo > nivelAnterior
      };
    } catch (erro) {
      console.error('Erro ao desbloquear conquista:', erro);
      throw erro;
    }
  }

  // Obter título baseado no nível
  static obterTituloPorNivel (nivel) {
    if (nivel >= 31) {return 'Conjurador Supremo'};
    if (nivel >= 21) {return 'Guardião do Librarium'};
    if (nivel >= 11) {return 'Caçador'};
    return 'Aspirante';
  }

  // Criar conquistas padrão para um novo usuário
  static async criarConquistasPadrao (usuarioId) {
    try {
      const conquistasPadrao = [
        {
          idUsuario: usuarioId,
          titulo: 'Primeira Chama',
          descricao: 'Complete seu primeiro hábito',
          tipo: 'primeira_semana',
          categoria: 'progresso',
          icone: 'chama',
          cor: '#FF6B6B',
          experienciaRecompensa: 25,
          raridade: 'comum',
          condicoes: {
            tipo: 'habitos_concluidos',
            valor: 1,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Semana de Dedicação',
          descricao: 'Complete hábitos por 7 dias consecutivos',
          tipo: 'sequencia_7_dias',
          categoria: 'tempo',
          icone: 'calendario',
          cor: '#4ECDC4',
          experienciaRecompensa: 100,
          raridade: 'raro',
          condicoes: {
            tipo: 'sequencia',
            valor: 7,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Mestre da Persistência',
          descricao: 'Complete hábitos por 30 dias consecutivos',
          tipo: 'sequencia_30_dias',
          categoria: 'tempo',
          icone: 'coroa',
          cor: '#FFD700',
          experienciaRecompensa: 500,
          raridade: 'epico',
          condicoes: {
            tipo: 'sequencia',
            valor: 30,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Caçador Iniciante',
          descricao: 'Alcance o nível 10',
          tipo: 'nivel_10',
          categoria: 'nivel',
          icone: 'espada',
          cor: '#8B5CF6',
          experienciaRecompensa: 200,
          raridade: 'raro',
          condicoes: {
            tipo: 'nivel',
            valor: 10,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Guardião do Tempo',
          descricao: 'Alcance o nível 20',
          tipo: 'nivel_20',
          categoria: 'nivel',
          icone: 'escudo',
          cor: '#10B981',
          experienciaRecompensa: 500,
          raridade: 'epico',
          condicoes: {
            tipo: 'nivel',
            valor: 20,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Conjurador Supremo',
          descricao: 'Alcance o nível 30',
          tipo: 'nivel_30',
          categoria: 'nivel',
          icone: 'estrela',
          cor: '#F59E0B',
          experienciaRecompensa: 1000,
          raridade: 'lendario',
          condicoes: {
            tipo: 'nivel',
            valor: 30,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Colecionador de Hábitos',
          descricao: 'Complete 50 hábitos diferentes',
          tipo: 'habitos_concluidos',
          categoria: 'progresso',
          icone: 'colecao',
          cor: '#EF4444',
          experienciaRecompensa: 300,
          raridade: 'raro',
          condicoes: {
            tipo: 'habitos_concluidos',
            valor: 50,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Perfeccionista',
          descricao: 'Complete todos os hábitos do dia por 5 dias',
          tipo: 'sequencia_perfeita',
          categoria: 'tempo',
          icone: 'diamante',
          cor: '#06B6D4',
          experienciaRecompensa: 400,
          raridade: 'epico',
          condicoes: {
            tipo: 'sequencia_perfeita',
            valor: 5,
            periodo: 'total'
          }
        },
        // Novas conquistas
        {
          idUsuario: usuarioId,
          titulo: 'Explorador',
          descricao: 'Complete hábitos de 5 categorias diferentes',
          tipo: 'variedade_categorias',
          categoria: 'progresso',
          icone: 'mapa',
          cor: '#8B5CF6',
          experienciaRecompensa: 150,
          raridade: 'raro',
          condicoes: {
            tipo: 'variedade_categorias',
            valor: 5,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Eficiência Semanal',
          descricao: 'Mantenha 80% de eficiência por uma semana',
          tipo: 'eficiencia_semanal',
          categoria: 'tempo',
          icone: 'relogio',
          cor: '#10B981',
          experienciaRecompensa: 200,
          raridade: 'raro',
          condicoes: {
            tipo: 'eficiencia_semanal',
            valor: 80,
            periodo: 'semanal'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Consistência Mensal',
          descricao: 'Mantenha 70% de consistência por um mês',
          tipo: 'consistencia_mensal',
          categoria: 'tempo',
          icone: 'calendario_mensal',
          cor: '#F59E0B',
          experienciaRecompensa: 300,
          raridade: 'epico',
          condicoes: {
            tipo: 'consistencia_mensal',
            valor: 70,
            periodo: 'mensal'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Velocista',
          descricao: 'Complete 3 hábitos diários em 5 dias diferentes',
          tipo: 'habitos_rapidos',
          categoria: 'tempo',
          icone: 'raio',
          cor: '#EF4444',
          experienciaRecompensa: 250,
          raridade: 'raro',
          condicoes: {
            tipo: 'habitos_rapidos',
            valor: 5,
            periodo: 'semanal'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Mestre da Variedade',
          descricao: 'Complete hábitos de 8 categorias diferentes',
          tipo: 'variedade_categorias',
          categoria: 'progresso',
          icone: 'paleta',
          cor: '#06B6D4',
          experienciaRecompensa: 400,
          raridade: 'epico',
          condicoes: {
            tipo: 'variedade_categorias',
            valor: 8,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Lenda da Persistência',
          descricao: 'Complete hábitos por 100 dias consecutivos',
          tipo: 'sequencia_100_dias',
          categoria: 'tempo',
          icone: 'coroa_lendaria',
          cor: '#F59E0B',
          experienciaRecompensa: 1000,
          raridade: 'lendario',
          condicoes: {
            tipo: 'sequencia',
            valor: 100,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Imperador dos Hábitos',
          descricao: 'Complete todos os hábitos do dia por 30 dias',
          tipo: 'sequencia_perfeita_30',
          categoria: 'tempo',
          icone: 'imperio',
          cor: '#DC2626',
          experienciaRecompensa: 1500,
          raridade: 'lendario',
          condicoes: {
            tipo: 'sequencia_perfeita',
            valor: 30,
            periodo: 'total'
          }
        },
        {
          idUsuario: usuarioId,
          titulo: 'Sábio do Conhecimento',
          descricao: 'Alcance 10.000 XP total',
          tipo: 'xp_10000',
          categoria: 'nivel',
          icone: 'livro_sabedoria',
          cor: '#7C3AED',
          experienciaRecompensa: 800,
          raridade: 'epico',
          condicoes: {
            tipo: 'xp_total',
            valor: 10000,
            periodo: 'total'
          }
        }
      ];

      const conquistasCriadas = [];
      for (const conquistaData of conquistasPadrao) {
        const conquista = new Conquista(conquistaData);
        await conquista.save();
        conquistasCriadas.push(conquista);
      }

      console.log(`${conquistasCriadas.length} conquistas padrão criadas para usuário ${usuarioId}`);
      return conquistasCriadas;
    } catch (erro) {
      console.error('Erro ao criar conquistas padrão:', erro);
      throw erro;
    }
  }

  // Obter estatísticas de conquistas de um usuário
  static async obterEstatisticasConquistas (usuarioId) {
    try {
      const [total, desbloqueadas, porRaridade, porCategoria] = await Promise.all([
        Conquista.countDocuments({ idUsuario: usuarioId }),
        Conquista.countDocuments({
          idUsuario: usuarioId,
          desbloqueadaEm: { $exists: true }
        }),
        Conquista.aggregate([
          { $match: { idUsuario: mongoose.Types.ObjectId(usuarioId) } },
          { $group: { _id: '$raridade', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Conquista.aggregate([
          { $match: { idUsuario: mongoose.Types.ObjectId(usuarioId) } },
          { $group: { _id: '$categoria', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
      ]);

      const xpTotal = await Conquista.aggregate([
        {
          $match: {
            idUsuario: mongoose.Types.ObjectId(usuarioId),
            desbloqueadaEm: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            totalXP: { $sum: '$experienciaRecompensa' }
          }
        }
      ]);

      return {
        total,
        desbloqueadas,
        bloqueadas: total - desbloqueadas,
        porcentagemDesbloqueio: total > 0 ? Math.round((desbloqueadas / total) * 100) : 0,
        porRaridade: porRaridade.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        porCategoria: porCategoria.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        xpTotal: xpTotal.length > 0 ? xpTotal[0].totalXP : 0
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas de conquistas:', erro);
      throw erro;
    }
  }

  // Limpar conquistas antigas e não desbloqueadas
  static async limparConquistasAntigas (dias = 90) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);

      const resultado = await Conquista.deleteMany({
        createdAt: { $lt: dataLimite },
        desbloqueadaEm: { $exists: false }
      });

      console.log(`${resultado.deletedCount} conquistas antigas removidas`);
      return resultado.deletedCount;
    } catch (erro) {
      console.error('Erro ao limpar conquistas antigas:', erro);
      throw erro;
    }
  }
}

module.exports = AchievementService;

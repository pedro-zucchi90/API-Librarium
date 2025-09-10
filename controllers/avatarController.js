const AvatarService = require('../services/avatarService');
const logger = require('../utils/logger');
const Usuario = require('../models/User');

exports.verificarEvolucao = async (req, res) => {
  try {
    const resultado = await AvatarService.verificarEvolucaoAvatar(req.usuario._id);

    if (resultado && resultado.evolucoesAplicadas.length > 0) {
      res.json({
        sucesso: true,
        mensagem: `🎭 Avatar evoluiu! ${resultado.evolucoesAplicadas.length} mudanças aplicadas`,
        evolucoes: resultado.evolucoesAplicadas,
        avatar: resultado.avatar,
        personalizacao: resultado.personalizacao
      });
    } else {
      res.json({
        sucesso: true,
        mensagem: '🎭 Nenhuma evolução disponível no momento',
        evolucoes: [],
        avatar: resultado?.avatar,
        personalizacao: resultado?.personalizacao
      });
    }
  } catch (erro) {
    logger.error('Erro ao verificar evolução do avatar:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível verificar a evolução do avatar...'
    });
  }
};

exports.obterEstatisticas = async (req, res) => {
  try {
    const estatisticas = await AvatarService.obterEstatisticasAvatar(req.usuario._id);

    if (estatisticas) {
      res.json({ sucesso: true, estatisticas });
    } else {
      res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Usuário não encontrado'
      });
    }
  } catch (erro) {
    logger.error('Erro ao obter estatísticas do avatar:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar as estatísticas do avatar...'
    });
  }
};

exports.obterTema = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Usuário não encontrado'
      });
    }
    const tema = AvatarService.obterTemaVisual(usuario.avatar);
    res.json({ sucesso: true, tema, avatar: usuario.avatar });
  } catch (erro) {
    logger.error('Erro ao obter tema do avatar:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar o tema do avatar...'
    });
  }
};

exports.obterProgresso = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Usuário não encontrado'
      });
    }

    const { avatar} = usuario;
    const personalizacao = usuario.personalizacaoAvatar;
    const proximaEvolucao = AvatarService.obterProximaEvolucao(avatar.nivel);
    let progressoEvolucao = 0;
    if (proximaEvolucao) {
      const nivelAtual = avatar.nivel;
      const nivelMaximo = 5;
      progressoEvolucao = Math.round((nivelAtual / nivelMaximo) * 100);
    }
    const equipamentos = AvatarService.contarEquipamentosDesbloqueados(personalizacao);
    const totalEquipamentos = 15;
    const progressoEquipamentos = Math.round((equipamentos.total / totalEquipamentos) * 100);

    res.json({
      sucesso: true,
      progresso: {
        evolucao: {
          nivelAtual: avatar.nivel,
          nivelMaximo: 5,
          proximaEvolucao,
          porcentagem: progressoEvolucao
        },
        equipamentos: {
          total: equipamentos.total,
          totalMaximo: totalEquipamentos,
          porcentagem: progressoEquipamentos,
          porNivel: equipamentos.porNivel
        },
        avatar: {
          tipo: avatar.tipo,
          evolucao: avatar.evolucao,
          desbloqueadoEm: avatar.desbloqueadoEm
        }
      }
    });
  } catch (erro) {
    logger.error('Erro ao obter progresso do avatar:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar o progresso do avatar...'
    });
  }
};

exports.obterHistorico = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Usuário não encontrado'
      });
    }
    const historico = [];
    if (usuario.avatar.desbloqueadoEm) {
      historico.push({
        tipo: 'avatar',
        descricao: `Avatar evoluiu para ${usuario.avatar.tipo}`,
        data: usuario.avatar.desbloqueadoEm,
        nivel: usuario.avatar.nivel
      });
    }
    Object.entries(usuario.personalizacaoAvatar).forEach(([categoria, item]) => {
      if (item.desbloqueadaEm && item.tipo !== 'nenhum' && item.tipo !== 'nenhuma') {
        historico.push({
          tipo: 'equipamento',
          categoria,
          descricao: `${categoria} ${item.tipo} desbloqueada`,
          data: item.desbloqueadaEm,
          nivel: item.nivel
        });
      }
    });
    historico.sort((a, b) => new Date(b.data) - new Date(a.data));
    res.json({ sucesso: true, historico, total: historico.length });
  } catch (erro) {
    logger.error('Erro ao obter histórico do avatar:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar o histórico do avatar...'
    });
  }
};

exports.obterProximosDesbloqueios = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);
    if (!usuario) {
      return res.status(404).json({
        erro: 'Usuário não encontrado',
        mensagem: '🌑 Usuário não encontrado'
      });
    }

    const proximosDesbloqueios = [];
    const proximaEvolucao = AvatarService.obterProximaEvolucao(usuario.avatar.nivel);
    if (proximaEvolucao) {
      proximosDesbloqueios.push({
        tipo: 'avatar',
        categoria: 'evolucao',
        descricao: `Evoluir para ${proximaEvolucao.nome}`,
        requisito: proximaEvolucao.requisito,
        nivel: proximaEvolucao.nivel
      });
    }
    if (usuario.nivel >= 10 && usuario.personalizacaoAvatar.arma.nivel < 2) {
      proximosDesbloqueios.push({
        tipo: 'equipamento',
        categoria: 'arma',
        descricao: 'Espada Melhorada',
        requisito: 'Nível 10',
        nivel: 2
      });
    }
    if (usuario.nivel >= 15 && usuario.personalizacaoAvatar.armadura.nivel < 2) {
      proximosDesbloqueios.push({
        tipo: 'equipamento',
        categoria: 'armadura',
        descricao: 'Armadura Melhorada',
        requisito: 'Nível 15',
        nivel: 2
      });
    }
    const conquistas = await require('../models/Achievement').find({
      idUsuario: usuario._id,
      desbloqueadaEm: { $exists: true }
    });
    const totalConquistas = conquistas.length;
    if (totalConquistas >= 15 && usuario.personalizacaoAvatar.acessorio.nivel < 2) {
      proximosDesbloqueios.push({
        tipo: 'equipamento',
        categoria: 'acessorio',
        descricao: 'Acessório Básico',
        requisito: '15+ conquistas',
        nivel: 2
      });
    }
    res.json({ sucesso: true, proximosDesbloqueios, total: proximosDesbloqueios.length });
  } catch (erro) {
    logger.error('Erro ao obter próximos desbloqueios:', erro);
    res.status(500).json({
      erro: 'Erro interno do servidor',
      mensagem: '💀 Não foi possível carregar os próximos desbloqueios...'
    });
  }
};



const departamentosRepository = require('../repositories/departamentos.repository');

const listarDepartamentos = async () => {
  return departamentosRepository.findAllDepartamentos();
};

module.exports = {
  listarDepartamentos
};

const departamentosRepository = require('../repositories/departamentos.repository');

const listarDepartamentos = async () => {
  return await departamentosRepository.findAllDepartamentos();
};

module.exports = {
  listarDepartamentos
};

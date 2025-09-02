const userStates = {};

// Establece el estado del usuario
const setState = (userId, state) => {
  userStates[userId] = state;
};

// Obtiene el estado del usuario
const getState = (userId) => {
  return userStates[userId];
};

// Limpia el estado del usuario
const clearState = (userId) => {
  delete userStates[userId];
};

// Actualiza el código de empresa en el estado del usuario
const setCompanyCode = (userId, companyCode) => {
  if (userStates[userId]) {
    userStates[userId].codigoEmpresa = companyCode; // Actualiza el código de empresa en el estado existente
  } else {
    userStates[userId] = { codigoEmpresa: companyCode }; // Crea un nuevo estado si no existe
  }
};

module.exports = { setState, getState, clearState, setCompanyCode };
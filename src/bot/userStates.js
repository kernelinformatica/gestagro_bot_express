export const userStates = {};

// Establece el estado del usuario
export const setState = (userId, state) => {
  userStates[userId] = state;
};

// Obtiene el estado del usuario
export const getState = (userId) => {
  return userStates[userId];
};

// Limpia el estado del usuario
export const clearState = (userId) => {
  delete userStates[userId];
};

export const isBlocked = (userId) => {
  return userStates[userId]?.bloqueado || false;
};

// Actualiza el código de empresa en el estado del usuario
export const setCompanyCode = (userId, companyCode) => {
  if (userStates[userId]) {
    userStates[userId].codigoEmpresa = companyCode; // Actualiza el código de empresa en el estado existente
  } else {
    userStates[userId] = { codigoEmpresa: companyCode }; // Crea un nuevo estado si no existe
  }
};

// Exportación predeterminada
export default {
  userStates,
  setState,
  getState,
  clearState,
  setCompanyCode,
};
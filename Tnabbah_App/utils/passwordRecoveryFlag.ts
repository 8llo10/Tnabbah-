let passwordRecoveryMode = false;

function setPasswordRecoveryMode(value: boolean) {
  passwordRecoveryMode = value;
}

function getPasswordRecoveryMode() {
  return passwordRecoveryMode;
}

export { setPasswordRecoveryMode, getPasswordRecoveryMode };

export default {
  setPasswordRecoveryMode,
  getPasswordRecoveryMode,
};
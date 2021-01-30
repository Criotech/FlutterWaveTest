module.exports = async (fieldValue, condition, conditionValue) => {
  switch (condition) {
    case 'eq':
      if (fieldValue === conditionValue) return true;
      break;
    case 'neq':
      if (fieldValue !== conditionValue) return true;
      break;
    case 'gt':
      if (parseInt (fieldValue) > parseInt (conditionValue)) return true;
      break;
    case 'gte':
      if (parseInt (fieldValue) >= parseInt (conditionValue)) return true;
      break;
    case 'contains':
      if (fieldValue.includes (conditionValue)) return true;
      break;
    default:
      return false;
  }
};

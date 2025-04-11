

function calcTotalAmount(hours, days, ammountPerhour) {

  let totalAmount;

  if (hours && days) {
    totalAmount = ((days * 24) + hours) * ammountPerhour;
  } else if (hours && days === null) {
    totalAmount = hours * ammountPerhour;
  } else if (hours === null && days) {
    totalAmount = days * 24 * ammountPerhour;
  } else {
    return null;
  }

  return totalAmount;
}


module.exports.calcTotalAmount = calcTotalAmount;
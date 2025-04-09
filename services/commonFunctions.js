

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


console.log(calcTotalAmount(6, 2, 10))
module.exports.calcTotalAmount = calcTotalAmount;
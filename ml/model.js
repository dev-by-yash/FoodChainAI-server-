function trainModel(data) {
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  const n = data.length;

  data.forEach(d => {
    const x = d.quantity;
    const y = d.waste;

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return (input) => slope * input + intercept;
}

module.exports = { trainModel };
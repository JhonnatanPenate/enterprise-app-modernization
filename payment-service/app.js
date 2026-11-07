const express = require('express');
const app = express();
app.use(express.json());

app.post('/process-payment', (req, res) => {
  const { orderId, amount } = req.body;
  const approved = Math.random() > 0.05;

  if (!approved) {
    return res.status(402).json({ success: false, reason: 'pago rechazado', source: 'microservicio-pago' });
  }

  return res.status(201).json({ success: true, orderId, source: 'microservicio-pago' });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`Microservicio de pago escuchando en ${PORT}`));

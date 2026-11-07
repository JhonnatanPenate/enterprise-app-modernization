require('./tracing');
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const STRANGLE_PAYMENT = process.env.STRANGLE_PAYMENT === 'true';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002';
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:4000';

app.post('/checkout', async (req, res) => {
  const { orderId, productId, amount } = req.body;

  try {
    const invResp = await axios.get(`${INVENTORY_SERVICE_URL}/check-stock`, { params: { productId } });

    if (!invResp.data.inStock) {
      return res.status(409).json({ success: false, reason: 'sin stock', source: 'microservicio-inventario' });
    }

    if (STRANGLE_PAYMENT) {
      const payResp = await axios.post(`${PAYMENT_SERVICE_URL}/process-payment`, { orderId, amount });
      return res.status(payResp.status).json(payResp.data);
    } else {
      const payResp = await axios.post(`${MONOLITH_URL}/checkout-payment-only`, { orderId, amount });
      return res.status(payResp.status).json(payResp.data);
    }
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    console.error(err);
    return res.status(500).json({ success: false, reason: 'error interno de la fachada' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fachada escuchando en ${PORT}, STRANGLE_PAYMENT=${STRANGLE_PAYMENT}`));

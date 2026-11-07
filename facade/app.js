const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const STRANGLE_INVENTORY = process.env.STRANGLE_INVENTORY === 'true';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001';
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:4000';

app.post('/checkout', async (req, res) => {
  const { orderId, productId, amount } = req.body;

  try {
    if (STRANGLE_INVENTORY) {
      // Ruta NUEVA: el inventario ya lo resuelve el microservicio extraido
      const invResp = await axios.get(`${INVENTORY_SERVICE_URL}/check-stock`, { params: { productId } });

      if (!invResp.data.inStock) {
        return res.status(409).json({ success: false, reason: 'sin stock', source: 'microservicio-inventario (via fachada)' });
      }

      // El pago todavia vive en el monolito (no se ha extraido en este laboratorio)
      const payResp = await axios.post(`${MONOLITH_URL}/checkout-payment-only`, { orderId, amount });
      return res.status(payResp.status).json(payResp.data);
    } else {
      // Ruta VIEJA: todo pasa por el monolito, tal cual funcionaba antes
      const monolithResp = await axios.post(`${MONOLITH_URL}/checkout`, { orderId, productId, amount });
      return res.status(monolithResp.status).json(monolithResp.data);
    }
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    console.error(err);
    return res.status(500).json({ success: false, reason: 'error interno de la fachada' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Fachada escuchando en ${PORT}, STRANGLE_INVENTORY=${STRANGLE_INVENTORY}`));

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const sapLoginRoute = require('./routes/portalr');
const profileRoute = require('./routes/profile');
const deliveryRoute = require('./routes/delivery');
const salesorderRoute = require('./routes/salesorder');
const inquiryRoute=require('./routes/inquiry');
const invoiceRoute=require('./routes/invoice');
const agingRoute=require('./routes/aging');
const creditRoute=require('./routes/credit');
const debitRoute=require('./routes/debit');
const invoice1Route=require('./routes/invoice1');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', sapLoginRoute);        // POST to /api
app.use('/profile', profileRoute);     // POST to /profile
app.use('/delivery',deliveryRoute);
app.use('/salesorder',salesorderRoute);
app.use('/inquiry',inquiryRoute);
app.use('/invoice',invoiceRoute);
app.use('/aging',agingRoute);
app.use('/credit',creditRoute);
app.use('/debit',debitRoute);
app.use('/invoice1',invoice1Route)
app.listen(3000, () => {
  console.log("Backend running on port 3000");
});

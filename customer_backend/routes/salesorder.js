const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const customerId = req.body.CUSTNO || req.body.custno || req.body.customerId;

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZFM_AISHUSALESORDER>
         <KUNNR>${customerId}</KUNNR>
      </urn:ZFM_AISHUSALESORDER>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishusalesorder?sap-client=100',
      soapEnvelope,
      {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'Authorization': 'Basic SzkwMTQ2NTpBaXNod2FyeWEqMjM=',
          'Cookie': 'sap-usercontext=sap-client=100',
        },
        responseType: 'text',
      }
    );

    console.log('HTTP Status Code:', response.status);
    
    // Improved XML parsing to handle multiple entries
    const parseAllEntries = (xml) => {
      const salesOrders = [];
      
      // Find all item blocks (adjust this pattern based on your actual XML structure)
      const itemPattern = /<item>(.*?)<\/item>/gs;
      const items = xml.match(itemPattern) || [];
      
      for (const item of items) {
        const extract = (tag) => {
          const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
          const match = item.match(regex);
          return match ? match[1] : '';
        };
        
        salesOrders.push({
          customerId: extract('KUNNR'),
          salesOrderNumber: extract('VBELN'),
          itemNumber: extract('POSNR'),
          materialNumber: extract('MATNR'),
          orderQuantity: extract('KWMENG'),
          salesUnit: extract('VRKME'),
          netValue: extract('NETWR'),
          currency: extract('WAERK'),
          orderDate: extract('AUDAT'),
          documentType: extract('AUART'),
          plant: extract('WERKS'),
          shippingPoint: extract('VSTEL'),
        });
      }
      
      return salesOrders;
    };

    const allSalesOrders = parseAllEntries(response.data);

    res.json({
      status: 'S',
      message: 'Sales order details fetched successfully',
      count: allSalesOrders.length,
      salesOrders: allSalesOrders,
    });

  } catch (error) {
    console.error('SAP Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      status: 'E',
      message: 'Error fetching sales order details.',
    });
  }
});
module.exports = router;
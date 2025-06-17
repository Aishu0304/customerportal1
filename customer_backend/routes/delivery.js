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
      <urn:ZFM_AISHUDEL>
         <KUNNR>${customerId}</KUNNR>
      </urn:ZFM_AISHUDEL>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishudelivery?sap-client=100',
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
    console.log('SAP Raw Response:', response.data);

    // Extract all item blocks from the XML
    const itemBlocks = response.data.match(/<item>(.*?)<\/item>/gs) || [];
    
    // Process each item block
    const delivery = itemBlocks.map(itemBlock => {
      // Helper function to extract values
      const extract = (tag) => {
        const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
        const match = itemBlock.match(regex);
        return match ? match[1] : '';
      };

      return {
        customerId: extract('KUNNR'),
        deliveryNumber: extract('VBELN'),
        itemNumber: extract('POSNR'),
        materialNumber: extract('MATNR'),
        deliveryType: extract('LFART'),
        deliveryQty: extract('LFIMG'),
        salesUnit: extract('VRKME'),
        netValue: extract('NETWR'),
        currency: extract('WAERK'),
        deliveryDate: extract('LFDAT_V'),
        overallStatus: extract('GBSTK'),
        shippingPoint: extract('VSTEL'),
        storageLocation: extract('LGORT'),
        plant: extract('WERKS')
      };
    });

    res.json({
      status: 'S',
      message: 'Delivery details fetched successfully',
      delivery: delivery, // Returns array of all deliveries
    });

  } catch (error) {
    console.error('SAP Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      status: 'E',
      message: 'Error fetching delivery details.',
      error: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const customerId = req.body.CUSTNO || req.body.custno;

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZFM_AISHAGING>
         <KUNNR>${customerId}</KUNNR>
      </urn:ZFM_AISHAGING>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishaging?sap-client=100',
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
    console.log('SAP Raw Response:', response.data);  // ✅ Log full XML

    const parseAgingEntries = (xml) => {
      const result = [];

      const itemPattern = /<item>(.*?)<\/item>/gs;
      const items = xml.match(itemPattern) || [];

      if (items.length === 0) {
        console.warn('⚠️ No <item> blocks found in XML!');
      }

      for (const item of items) {
        const extract = (tag) => {
          const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
          const match = item.match(regex);
          return match ? match[1] : '';
        };

        result.push({
          billingDoc: extract('VBELN'),
          billingDate: extract('FKDAT'),
          dueDate: extract('DUE_DATE'),
          aging: extract('AGING'),
          paymentStatus: extract('PAYMENT_STATUS'),
          netValue: extract('NETWR'),
          currency: extract('WAERK'),
          paymentTerms: extract('ZTERM'),
          customer: extract('KUNAG'),
          salesOrg: extract('VKORG'),
          distChannel: extract('VTWEG'),
        });
      }

      return result;
    };

    const agingData = parseAgingEntries(response.data);

    res.json({
      status: 'S',
      message: 'Aging details fetched successfully',
      count: agingData.length,
      agingDetails: agingData,
    });

  } catch (error) {
    console.error('SAP Aging Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      status: 'E',
      message: 'Error fetching aging data from SAP.',
    });
  }
});

module.exports = router;

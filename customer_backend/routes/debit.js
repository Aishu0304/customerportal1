const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  const customerId = req.body.CUSTNO || req.body.custno;

  if (!customerId) {
    return res.status(400).json({
      status: 'E',
      message: 'Customer number is required',
    });
  }

  const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:urn="urn:sap-com:document:sap:rfc:functions">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:ZFM_AISHDEBIT>
         <KUNNR>${customerId}</KUNNR>
      </urn:ZFM_AISHDEBIT>
   </soapenv:Body>
</soapenv:Envelope>`;

  try {
    const response = await axios.post(
      'http://AZKTLDS5CP.kcloud.com:8000/sap/bc/srt/scs/sap/ztest_aishdebit?sap-client=100',
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
    console.log('SAP Raw Response (Credit Memo):', response.data);

    const parseCreditEntries = (xml) => {
      const result = [];

      const itemPattern = /<item>(.*?)<\/item>/gs;
      const items = xml.match(itemPattern) || [];

      if (items.length === 0) {
        console.warn('⚠️ No <item> blocks found in XML (CREDIT)!');
      }

      for (const item of items) {
        const extract = (tag) => {
          const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`);
          const match = item.match(regex);
          return match ? match[1] : '';
        };

        result.push({
          billingDoc: extract('VBELN'),
          docType: extract('FKART'),
          billingCategory: extract('FKTYP'),
          salesDocCat: extract('VBTYP'),
          salesOrg: extract('VKORG'),
          customer: extract('KUNAG'),
          currency: extract('WAERK'),
          pricingProc: extract('KALSM'),
          pricingNumber: extract('KNUMV'),
          billingDate: extract('FKDAT'),
          exchangeRate: extract('KURRF'),
          netValue: extract('NETWR'),
          entryTime: extract('ERZET'),
          entryDate: extract('ERDAT'),
          poNumber: extract('BSTNK_VF'),
          materialNo: extract('MATNR'),
          itemNo: extract('POSNR'),
          salesUnit: extract('VRKME'),
        });
      }

      return result;
    };

    const creditData = parseCreditEntries(response.data);

    res.json({
      status: 'S',
      message: 'Debit memo details fetched successfully',
      count: creditData.length,
      creditDetails: creditData,
    });

  } catch (error) {
    console.error('SAP Credit Memo Request Error:', error.response ? error.response.data : error.message);
    res.status(500).json({
      status: 'E',
      message: 'Error fetching credit memo data from SAP.',
    });
  }
});

module.exports = router;

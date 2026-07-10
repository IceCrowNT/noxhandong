const fs = require('fs');
const JSZip = require('jszip');

async function updateFeeNoticeTemplate() {
  const buf = fs.readFileSync('templates/fee-notice-template.docx');
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');
  
  xml = xml.replaceAll('L2.220', '{{MA_CAN}}');
  xml = xml.replaceAll('L1.101', '{{MA_CAN}}');
  xml = xml.replaceAll('L1.103', '{{MA_CAN}}');
  xml = xml.replaceAll('250.000', '{{PHI_HANG_THANG}}');
  xml = xml.replaceAll('1.500.000', '{{TONG_PHI}}');
  xml = xml.replaceAll('25/07/2026', '{{HAN_NOP_PHI}}');
  xml = xml.replaceAll('01/07/2026', '{{KY_PHI_BAT_DAU}}');
  xml = xml.replaceAll('31/12/2026', '{{KY_PHI_KET_THUC}}');
  xml = xml.replaceAll('01/05/2026', '{{KY_PHI_BAT_DAU}}');
  xml = xml.replaceAll('30/10/2026', '{{KY_PHI_KET_THUC}}');
  xml = xml.replaceAll('“ Tòa/lô + số căn hộ + Số điện thoại + nộp phí QLVH từ 01/07/2026 đến 31/12/2026”', '“ {{NOI_DUNG_CK}}”');
  xml = xml.replaceAll('“ Tòa/lô + số căn hộ + Số điện thoại + nộp phí QLVH từ 01/05/2026 đến 30/10/2026”', '“ {{NOI_DUNG_CK}}”');

  
  zip.file('word/document.xml', xml);
  const outBuf = await zip.generateAsync({type: 'nodebuffer'});
  fs.writeFileSync('templates/fee-notice-template-v2.docx', outBuf);
  console.log('Created templates/fee-notice-template-v2.docx');
}
updateFeeNoticeTemplate();

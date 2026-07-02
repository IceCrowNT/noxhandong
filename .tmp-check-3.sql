select id, ky_du_lieu, trang_thai, la_batch_public_hien_hanh, ten_file_nguon, public_luc
from batch_trang_thai_phi_public
order by public_luc desc nulls last, id desc;

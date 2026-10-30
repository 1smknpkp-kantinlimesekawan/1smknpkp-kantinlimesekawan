(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const rupiah = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
  const get = (key, fallback) => { try { const x=localStorage.getItem(key); return x ? JSON.parse(x) : fallback; } catch { return fallback; } };
  const put = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  let cart = get('sajikaCart', {});
  let profile = get('sajikaProfile', {name:'', classroom:'', contact:''});
  let toastTimer;
  function toast(message){ const el=$('#toast'); if(!el) return; el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2500); }
  function countCart(){ return Object.values(cart).reduce((n,item)=>n+item.qty,0); }
  function totalCart(){ return Object.values(cart).reduce((n,item)=>n+item.price*item.qty,0); }
  function updateBadge(){ const el=$('#cartCount'); if(el) el.textContent=countCart(); }
  function saveCart(){ put('sajikaCart',cart); updateBadge(); }
  function add(button){ const id=button.dataset.id, name=button.dataset.name, price=Number(button.dataset.price); if(!id||!name||!Number.isFinite(price))return; if(!cart[id])cart[id]={id,name,price,qty:0}; cart[id].qty++; saveCart(); toast(name+' ditambahkan ke keranjang.'); }
 const mieModal = $('#mieModal');
  const mieSummary = $('#mieSummary');
  const mieSubmit = $('#mieSubmit');

  function pilihanMie() {
    const ambil = nama =>
      document.querySelector(`input[name="${nama}"]:checked`)?.value;

    return {
      jenis: ambil('jenisMie') || 'Goreng',
      telur: ambil('telurMie') || 'Tanpa telur',
      selada: ambil('seladaMie') || 'Tanpa selada',
      level: ambil('levelMie') || '3'
    };
  }

  function perbaruiRingkasanMie() {
    if (!mieSummary) return;
    const p = pilihanMie();
    mieSummary.textContent =
      `🍜 Mie ${p.jenis} · ${p.telur} · ${p.selada} · Cabe level ${p.level}`;
  }

  function tutupPilihanMie() {
    if (mieModal) mieModal.hidden = true;
  }

  function bukaPilihanMie() {
    if (!mieModal) return;
    mieModal.hidden = false;
    perbaruiRingkasanMie();
  }

   
  // Tombol menu dan popup mie
  $$('.add').forEach(btn => {
    btn.addEventListener('click', () => {
      const nama = (btn.dataset.name || '').toLowerCase();

      if (nama.includes('mie goreng/kuah')) {
        bukaPilihanMie();
      } else {
        add(btn);
      }
    });
  });


  if (mieModal) {
    mieModal.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', perbaruiRingkasanMie);
    });

    mieModal.querySelectorAll('[data-close-mie]').forEach(btn => {
      btn.addEventListener('click', tutupPilihanMie);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !mieModal.hidden) {
        tutupPilihanMie();
      }
    });
  }

  if (mieSubmit) {
    mieSubmit.addEventListener('click', () => {
      const p = pilihanMie();
      const nama = `Mie ${p.jenis}`;
      const detail =
        `${p.telur}, ${p.selada}, cabe awut level ${p.level}`;

      // ID berbeda untuk setiap kombinasi pilihan.
      const id = 'mie-custom-' + [
        p.jenis, p.telur, p.selada, p.level
      ].join('-').toLowerCase().replace(/\s+/g, '-');

      const price = p.telur === 'Pakai telur' ? 10000 : 8000;

      if (!cart[id]) {
        cart[id] = {
          id,
          name: nama,
          price,
          qty: 0,
          detail
        };
      }

      cart[id].qty++;
      saveCart();
      tutupPilihanMie();
      toast(`${nama} (${detail}) ditambahkan ke keranjang.`);
    });
  }
  updateBadge();

  // Filter kategori pada halaman menu.
  const categoryButtons=$$('.category[data-filter]');
  categoryButtons.forEach(btn=>btn.addEventListener('click',()=>{
    categoryButtons.forEach(b=>b.classList.remove('selected')); btn.classList.add('selected');
    const f=btn.dataset.filter; $$('.product').forEach(card=>{const cats=(card.dataset.category||'').split(/\s+/);card.classList.toggle('hide',f!=='all'&&!cats.includes(f));});
  }));
  const params=new URLSearchParams(location.search), category=params.get('kategori');
  if(category && categoryButtons.length){const b=categoryButtons.find(x=>x.dataset.filter===category);if(b)b.click();}

  // Pencarian pada halaman khusus.
  const searchForm=$('#searchForm'), searchInput=$('#searchInput');
  if(searchForm&&searchInput){
    const initial=params.get('q')||''; searchInput.value=initial;
    const filter=()=>{const q=searchInput.value.trim().toLocaleLowerCase('id-ID');let n=0;$$('#searchProducts .product').forEach(card=>{const text=(card.dataset.name+' '+card.dataset.description).toLocaleLowerCase('id-ID');const show=text.includes(q);card.classList.toggle('hide',!show);if(show)n++;});const note=$('#searchResults');if(note)note.textContent=`Menampilkan ${n} menu${q?' untuk pencarian “'+searchInput.value.trim()+'”':''}.`;};
    searchInput.addEventListener('input',filter);searchForm.addEventListener('submit',e=>{e.preventDefault();filter();});filter();
  }

  // Halaman keranjang, qty diubah dan disimpan di localStorage.
  const cartContents=$('#cartContents');
  function renderCart(){if(!cartContents)return;cartContents.replaceChildren();const rows=Object.values(cart);
    if(!rows.length){const empty=document.createElement('div');empty.className='empty-state';empty.innerHTML='<div class="emoji">🛒</div><h3>Keranjang masih kosong</h3><p>Pilih menu favoritmu terlebih dahulu.</p><a class="btn btn-orange" href="menu.html">Lihat Menu</a>';cartContents.append(empty);}
    rows.forEach(item=>{const row=document.createElement('div');row.className='cart-row';const info=document.createElement('div');const h=document.createElement('h3');h.textContent=item.name;
      const p=document.createElement('p');
      p.textContent=
      `${rupiah(item.price)} × ${item.qty} = ${rupiah(item.price*item.qty)}`;
      info.append(h,p);const controls=document.createElement('div');controls.className='qty-controls';
      if (item.detail) {
  const detail = document.createElement('p');
  detail.className = 'cart-item-detail';
  detail.textContent = item.detail;
  info.append(detail);
}
      const make=(label,action,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.action=action;b.dataset.id=item.id;if(cls)b.className=cls;return b;};
      const qty=document.createElement('span');qty.textContent=item.qty;controls.append(make('−','minus'),qty,make('+','plus'),make('Hapus','remove','remove-item'));row.append(info,controls);cartContents.append(row);});
    const total=$('#cartTotal');if(total)total.textContent=rupiah(totalCart());const badge=$('#cartCount');if(badge)badge.textContent=countCart();saveCart();
  }
  if(cartContents){renderCart();cartContents.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const item=cart[b.dataset.id];if(!item)return;if(b.dataset.action==='plus')item.qty++;if(b.dataset.action==='minus'){item.qty--;if(item.qty<=0)delete cart[b.dataset.id];}if(b.dataset.action==='remove')delete cart[b.dataset.id];renderCart();});}
  
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxs3pPeI5DfBE2EQNP2Cc5U_CTHX-9hW9ADBU096A0aPm_6rVDGSC7Gpx1HMDTC6gaC/exec";

const checkout = $('#checkoutForm');

if (checkout) {
  checkout.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!countCart()) {
      toast('Keranjang masih kosong.');
      return;
    }

    const name = $('#orderName')?.value.trim() || '';
    const note = $('#orderNote')?.value.trim() || '';
    const payment = $('#paymentMethod')?.value || '';
    const paymentReference =
      $('#paymentReference')?.value.trim() || '';

    if (!name || !payment) {
      toast('Isi nama dan pilih metode pembayaran.');
      return;
    }

    const payload = {
      nama: name,
      kelas: '',
      pesanan: JSON.stringify(Object.values(cart)),
      total: totalCart(),
      pembayaran: payment,
      catatan: [note, paymentReference]
        .filter(Boolean)
        .join(' | ')
    };

    const tombol = $('#checkoutButton');

    if (tombol) {
      tombol.disabled = true;
      tombol.textContent = 'Mengirim pesanan...';
    }

    try {
      sessionStorage.setItem(
        'sajikaPesananSukses',
        JSON.stringify(payload)
      );

      // Mulai mengirim data ke Google Sheets.
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        // Permintaan selesai, tetapi respons no-cors
        // tidak bisa memastikan data tersimpan.
        cart = {};
        saveCart();
        checkout.reset();

        window.location.href = 'pesanan-sukses.html';

      } catch (error) {
        console.error('Pengiriman ke Sheets gagal:', error);

        toast('Pengiriman gagal. Periksa koneksi internet.');

        if (tombol) {
          tombol.disabled = false;
          tombol.textContent = 'Konfirmasi Pesanan';
        }
      }

    } catch (error) {
      console.error('Kesalahan checkout:', error);
      toast('Terjadi kesalahan saat memproses pesanan.');
      if (tombol) {
        tombol.disabled = false;
        tombol.textContent = 'Konfirmasi Pesanan';
      }
    }
  });
}
  // Profil demo disimpan secara lokal.
  const profileForm=$('#profileForm');
  if(profileForm){$('#profileName').value=profile.name||'';$('#profileClass').value=profile.classroom||'';$('#profileContact').value=profile.contact||'';profileForm.addEventListener('submit',e=>{e.preventDefault();profile={name:$('#profileName').value.trim(),classroom:$('#profileClass').value.trim(),contact:$('#profileContact').value.trim()};put('sajikaProfile',profile);toast('Profil berhasil disimpan di browser.');});
    const clear=$('#clearProfile');if(clear)clear.addEventListener('click',()=>{profile={name:'',classroom:'',contact:''};put('sajikaProfile',profile);profileForm.reset();toast('Data profil lokal dihapus.');});}
  const loginForm=$('#loginForm');if(loginForm){$('#loginName').value=profile.name||'';$('#loginClass').value=profile.classroom||'';loginForm.addEventListener('submit',e=>{e.preventDefault();profile={...profile,name:$('#loginName').value.trim(),classroom:$('#loginClass').value.trim()};put('sajikaProfile',profile);toast('Berhasil masuk dalam mode demo.');setTimeout(()=>location.href='profil.html',700);});}
})();
// PILIH METODE PEMBAYARAN
const paymentMethod = document.getElementById("paymentMethod");
const qrisSection = document.getElementById("qrisSection");

if (paymentMethod && qrisSection) {
    function tampilkanQRIS() {
        qrisSection.hidden = paymentMethod.value !== "QRIS";
    }

    paymentMethod.addEventListener("change", tampilkanQRIS);
    tampilkanQRIS();
}
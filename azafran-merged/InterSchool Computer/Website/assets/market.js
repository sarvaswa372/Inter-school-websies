/* AZAFRÁN — the bazaar */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var products = [
    {
      id: 'silk-stole',
      title: 'Hand-painted silk stole',
      maker: 'Meera Joshi',
      city: 'Jaipur',
      country: 'India',
      category: 'textiles',
      catLabel: 'Textiles',
      price: 68,
      priceLabel: '€68',
      img: 'assets/img/product-textile.jpg',
      alt: 'A hand-painted silk textile with figures and floral motifs',
      desc: 'A one-off silk panel, hand-painted in a Jaipur studio with scenes from the Aravalli hills. Finished with a hand-rolled hem and a little weight in the corners so it falls beautifully.',
      materials: 'Mulberry silk, natural dyes',
      edition: '1 of 6',
      ships: 'Jaipur, India'
    },
    {
      id: 'abanico',
      title: 'Hand-painted abanico',
      maker: 'Taller Abanico',
      city: 'Sevilla',
      country: 'España',
      category: 'home',
      catLabel: 'Home',
      price: 52,
      priceLabel: '€52',
      img: 'assets/img/product-fan.jpg',
      alt: 'A traditional Spanish folding fan painted with flowers',
      desc: 'A hand-painted folding fan, made the traditional Andalusian way. Painted silk leaf, olive-wood ribs, and a cotton sleeve for keeping it safe between parties.',
      materials: 'Painted silk, olive wood',
      edition: '1 of 12',
      ships: 'Sevilla, España'
    },
    {
      id: 'blue-vase',
      title: 'Blue pottery vase',
      maker: 'Kiln 04',
      city: 'Jaipur',
      country: 'India',
      category: 'home',
      catLabel: 'Home',
      price: 120,
      priceLabel: '€120',
      img: 'assets/img/product-vase.jpg',
      alt: 'A blue and white hand-painted pottery vase from Jaipur',
      desc: 'Wheel-thrown quartz pottery, painted freehand in cobalt and copper. A modern take on Jaipur’s blue-pottery tradition — each side painted slightly differently, as it should be.',
      materials: 'Quartz clay, cobalt oxide',
      edition: 'One of one',
      ships: 'Jaipur, India'
    },
    {
      id: 'olive-oil',
      title: 'Andalusian olive oil',
      maker: 'Casa Olivar',
      city: 'Jaén',
      country: 'España',
      category: 'pantry',
      catLabel: 'Pantry',
      price: 26,
      priceLabel: '€26',
      img: 'assets/img/product-oil.jpg',
      alt: 'Bottles of olive oil from Andalucía',
      desc: 'First-press extra virgin olive oil from a family grove in Jaén. Grassy, peppery, and very good on warm bread. Harvested and bottled in small batches.',
      materials: '100% Picual olives',
      edition: '500ml',
      ships: 'Jaén, España'
    },
    {
      id: 'jhumkas',
      title: 'Oxidised silver jhumkas',
      maker: 'Naina Silver',
      city: 'Udaipur',
      country: 'India',
      category: 'jewellery',
      catLabel: 'Jewellery',
      price: 46,
      priceLabel: '€46',
      img: 'assets/img/product-earrings.jpg',
      alt: 'A pair of ornate silver jhumka earrings',
      desc: 'Silver jhumkas cast and finished by hand, with the soft oxidised surface that makes old jewellery feel like it has a story. Light enough to wear all evening.',
      materials: 'Recycled 925 silver',
      edition: '1 of 8',
      ships: 'Udaipur, India'
    },
    {
      id: 'paella-kit',
      title: 'Paella kit for four',
      maker: 'La Paellera',
      city: 'Valencia',
      country: 'España',
      category: 'pantry',
      catLabel: 'Pantry',
      price: 38,
      priceLabel: '€38',
      img: 'assets/img/product-paella.jpg',
      alt: 'A paella pan filled with golden rice, peppers and lemon',
      desc: 'Everything but the pan: bomba rice, smoked pimentón, saffron and a family sofrito recipe. Cook it slowly, fight over the crispy bits, and thank Valencia.',
      materials: 'Bomba rice, pimentón, saffron',
      edition: 'Serves 4',
      ships: 'Valencia, España'
    },
    {
      id: 'block-scarf',
      title: 'Block-print cotton scarf',
      maker: 'Aarti Weaves',
      city: 'Jaipur',
      country: 'India',
      category: 'textiles',
      catLabel: 'Textiles',
      price: 34,
      priceLabel: '€34',
      img: 'assets/img/product-scarves.jpg',
      alt: 'A stack of brightly coloured hand-block-printed scarves',
      desc: 'A soft cotton scarf, hand-blocked with carved teak blocks and dyed in small batches. No two repeats are ever quite the same — that is the point.',
      materials: 'Cotton, natural indigo',
      edition: '1 of 20',
      ships: 'Jaipur, India'
    },
    {
      id: 'sevilla-print',
      title: 'Plaza de España, print',
      maker: 'Estudio Sur',
      city: 'Sevilla',
      country: 'España',
      category: 'prints',
      catLabel: 'Prints',
      price: 45,
      priceLabel: '€45',
      img: 'assets/img/sevilla-plaza.jpg',
      alt: 'A sunlit view of the Plaza de España in Sevilla',
      desc: 'An archival giclée print of Plaza de España at first light. Printed on cotton-rag paper in a small Sevilla studio, signed and numbered by the photographer.',
      materials: 'Cotton rag, pigment inks',
      edition: '1 of 50',
      ships: 'Sevilla, España'
    },
    {
      id: 'blue-jug',
      title: 'Blue pottery jug',
      maker: 'Kiln 04',
      city: 'Jaipur',
      country: 'India',
      category: 'home',
      catLabel: 'Home',
      price: 86,
      priceLabel: '€86',
      img: 'assets/img/product-vase-2.jpg',
      alt: 'A tall blue pottery jug with a floral pattern',
      desc: 'A sculptural jug with the classic Raja-Rani motif, thrown and painted by the same pair of hands. Use it for flowers, water, or simply to make a shelf feel alive.',
      materials: 'Quartz clay, cobalt oxide',
      edition: 'One of one',
      ships: 'Jaipur, India'
    },
    {
      id: 'saffron',
      title: 'Kashmiri saffron, 2g',
      maker: 'Kesar Collective',
      city: 'Pampore',
      country: 'India',
      category: 'pantry',
      catLabel: 'Pantry',
      price: 18,
      priceLabel: '€18',
      img: 'assets/img/product-saffron.jpg',
      alt: 'A small pile of deep red saffron threads',
      desc: 'Grade-one saffron threads, hand-picked in the Kashmir valley and packed in a glass vial. A little goes a long way — into rice, milk, or a very good paella.',
      materials: '100% saffron threads',
      edition: '2g vial',
      ships: 'Pampore, India',
      blend: true
    },
    {
      id: 'block-fabric',
      title: 'Block-print fabric, per metre',
      maker: 'Aarti Weaves',
      city: 'Jaipur',
      country: 'India',
      category: 'textiles',
      catLabel: 'Textiles',
      price: 22,
      priceLabel: '€22 / m',
      img: 'assets/img/product-fabric.jpg',
      alt: 'Bolts of hand-block-printed cotton fabric',
      desc: 'Hand-blocked cotton by the metre, ready for a table runner, a first quilting project, or a curtain that makes the room. Natural indigo and madder root.',
      materials: 'Cotton, natural dyes',
      edition: 'Sold by the metre',
      ships: 'Jaipur, India'
    },
    {
      id: 'jaipur-print',
      title: 'Hawa Mahal, print',
      maker: 'Pink City Press',
      city: 'Jaipur',
      country: 'India',
      category: 'prints',
      catLabel: 'Prints',
      price: 45,
      priceLabel: '€45',
      img: 'assets/img/hero-jaipur.jpg',
      alt: 'A pink Hawa Mahal facade in Jaipur',
      desc: 'Hawa Mahal in the morning haze, printed as an archival giclée on cotton rag. A little piece of the Pink City’s most famous silhouette for your wall.',
      materials: 'Cotton rag, pigment inks',
      edition: '1 of 50',
      ships: 'Jaipur, India'
    }
  ];

  var marketCleanup = null;

  function initMarket() {
    var grid = document.getElementById('productGrid');
    if (!grid) return;
  var searchInput = document.getElementById('bazaarSearch');
  var resultCount = document.getElementById('resultCount');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var allCount = document.querySelector('[data-count="all"]');
  var activeFilter = 'all';
  var query = '';

  var modal = document.getElementById('productModal');
  var modalImg = document.getElementById('modalImg');
  var modalCat = document.getElementById('modalCat');
  var modalTitle = document.getElementById('modalTitle');
  var modalPrice = document.getElementById('modalPrice');
  var modalMaker = document.getElementById('modalMaker');
  var modalDesc = document.getElementById('modalDesc');
  var modalMaterials = document.getElementById('modalMaterials');
  var modalEdition = document.getElementById('modalEdition');
  var modalShips = document.getElementById('modalShips');
  var modalMail = document.getElementById('modalMail');
  var modalAdd = document.getElementById('modalAdd');
  var modalClose = document.querySelector('[data-modal-close]');
  var toast = document.getElementById('toast');
  var lastFocused = null;
  var toastTimer = null;
  var addTimer = null;
  var productIO = null;

  /* ------------------------------------------------------------------
     Render
     ------------------------------------------------------------------ */
  function countFor(category) {
    return products.filter(function (p) { return p.category === category; }).length;
  }

  function updateCounts() {
    if (allCount) allCount.textContent = products.length;
    chips.forEach(function (chip) {
      var filter = chip.getAttribute('data-filter');
      var span = chip.querySelector('.chipCount');
      if (span) span.textContent = filter === 'all' ? products.length : countFor(filter);
    });
  }

  function matches(product) {
    var byCategory = activeFilter === 'all' || product.category === activeFilter;
    var haystack = (product.title + ' ' + product.maker + ' ' + product.city + ' ' + product.country + ' ' + product.catLabel).toLowerCase();
    var bySearch = !query || haystack.indexOf(query) !== -1;
    return byCategory && bySearch;
  }

  function render() {
    var visible = products.filter(matches);
    grid.innerHTML = '';
    if (productIO) {
      productIO.disconnect();
      productIO = null;
    }

    if (!visible.length) {
      var empty = document.createElement('div');
      empty.className = 'product-empty';
      empty.innerHTML = '<strong>Nothing in this corner yet.</strong>Try another category, or search for a maker or a city.';
      grid.appendChild(empty);
    } else {
      var cards = [];
      visible.forEach(function (p, i) {
        var card = document.createElement('a');
        card.className = 'product-card reveal';
        card.href = '#piece-' + p.id;
        card.setAttribute('data-product', p.id);
        card.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-label', p.title + ', ' + p.priceLabel + ', by ' + p.maker + '. Open quick view.');
        card.style.setProperty('--d', (i % 4) * 65 + 'ms');
        card.innerHTML =
          '<div class="product-media' + (p.blend ? ' product-media--blend' : '') + '">' +
            '<img src="' + p.img + '" alt="' + p.alt + '" loading="lazy">' +
            '<span class="product-cat">' + p.catLabel + '</span>' +
            '<span class="product-quick">Quick view</span>' +
          '</div>' +
          '<div class="product-info">' +
            '<p class="product-name">' + p.title + '</p>' +
            '<div class="product-maker-row"><span class="product-maker">' + p.maker + ' · ' + p.city + '</span><span class="product-price" data-amt="' + p.price + '" data-cur="EUR" data-suffix="' + p.priceLabel.replace(/^€[\d.,]+/, '') + '">' + p.priceLabel + '</span></div>' +
          '</div>';
        if (window.AZAFRAN && window.AZAFRAN.applyCurrency) window.AZAFRAN.applyCurrency(card);
        card.addEventListener('click', function (event) {
          event.preventDefault();
          openModal(p.id, card);
        });
        grid.appendChild(card);
        cards.push(card);
      });

      if ('IntersectionObserver' in window) {
        productIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              productIO.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
        cards.forEach(function (card) { productIO.observe(card); });
      } else {
        cards.forEach(function (card) { card.classList.add('is-in'); });
      }
    }

    resultCount.textContent = visible.length + (visible.length === 1 ? ' piece' : ' pieces');
  }

  /* ------------------------------------------------------------------
     Filters
     ------------------------------------------------------------------ */
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render();
      var gridTop = grid.getBoundingClientRect().top;
      if (gridTop < 80) {
        grid.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      query = searchInput.value.trim().toLowerCase();
      render();
    });
  }

  /* ------------------------------------------------------------------
     Quick view modal
     ------------------------------------------------------------------ */
  function openModal(id, trigger) {
    var p = products.filter(function (item) { return item.id === id; })[0];
    if (!p) return;

    lastFocused = trigger || document.activeElement;
    modalImg.src = p.img;
    modalImg.alt = p.alt;
    modalCat.textContent = p.catLabel;
    modalTitle.textContent = p.title;
    modalPrice.setAttribute('data-amt', p.price);
    modalPrice.setAttribute('data-cur', 'EUR');
    modalPrice.setAttribute('data-suffix', p.priceLabel.replace(/^€[\d.,]+/, ''));
    modalPrice.textContent = p.priceLabel;
    if (window.AZAFRAN && window.AZAFRAN.applyCurrency) window.AZAFRAN.applyCurrency(modalPrice);
    modalMaker.textContent = p.maker + ' · ' + p.city + ', ' + p.country;
    modalDesc.textContent = p.desc;
    modalMaterials.textContent = p.materials;
    modalEdition.textContent = p.edition;
    modalShips.textContent = p.ships;
    modalMail.href = 'mailto:hola@azafran.exchange?subject=' + encodeURIComponent('Enquiry: ' + p.title + ' by ' + p.maker);
    modalAdd.disabled = false;
    modalAdd.textContent = 'Add to bag';

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(function () { if (modalClose) modalClose.focus(); }, 40);
  }

  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
  }

  function onKeydown(event) {
    if (!modal || !modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    var focusables = modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', onKeydown);

  if (modalAdd) {
    modalAdd.addEventListener('click', function () {
      showToast('Added to your bag — checkout opens soon.');
      modalAdd.textContent = 'Added ✓';
      modalAdd.disabled = true;
      window.clearTimeout(addTimer);
      addTimer = window.setTimeout(function () {
        modalAdd.textContent = 'Add to bag';
        modalAdd.disabled = false;
      }, 2400);
    });
  }

  /* ------------------------------------------------------------------
     Tiny toast
     ------------------------------------------------------------------ */
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove('is-on');
    }, 3000);
  }

    updateCounts();
    render();

    marketCleanup = function () {
      if (productIO) {
        productIO.disconnect();
        productIO = null;
      }
      window.clearTimeout(toastTimer);
      window.clearTimeout(addTimer);
      document.removeEventListener('keydown', onKeydown);
      if (modal && modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
      document.body.style.overflow = '';
    };
  }

  function cleanupMarket() {
    if (marketCleanup) {
      marketCleanup();
      marketCleanup = null;
    }
  }

  window.AZAFRAN = window.AZAFRAN || {};
  window.AZAFRAN.initMarket = initMarket;
  window.AZAFRAN.cleanupMarket = cleanupMarket;
})();

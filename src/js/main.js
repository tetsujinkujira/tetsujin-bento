// モバイルメニューの開閉
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuBtn && mobileMenu) {
    // メニュー内のフォーカス可能な要素を取得
    const getFocusableElements = () => {
      return mobileMenu.querySelectorAll('a[href], button:not([disabled])');
    };

    // メニューを開く
    const openMenu = () => {
      mobileMenu.classList.remove('hidden');
      menuBtn.classList.add('active');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'メニューを閉じる');
      // 最初のリンクにフォーカス
      const firstLink = mobileMenu.querySelector('a');
      if (firstLink) {
        setTimeout(() => firstLink.focus(), 100);
      }
    };

    // メニューを閉じる
    const closeMenu = () => {
      mobileMenu.classList.add('hidden');
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'メニューを開く');
      menuBtn.focus();
    };

    // メニューが開いているか確認
    const isMenuOpen = () => !mobileMenu.classList.contains('hidden');

    menuBtn.addEventListener('click', () => {
      if (isMenuOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // メニュー外をクリックしたら閉じる
    document.addEventListener('click', (e) => {
      if (isMenuOpen() && !menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMenu();
      }
    });

    // Escapeキーでメニューを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen()) {
        closeMenu();
      }
    });

    // タブキーでフォーカストラップ（メニュー内に留める）
    mobileMenu.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  // スムーズスクロール（アンカーリンク）
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // モバイルメニューを閉じる
        if (mobileMenu) {
          mobileMenu.classList.add('hidden');
        }
      }
    });
  });

  // ========================================
  // スクロールトリガーアニメーション
  // ========================================
  const scrollAnimateElements = document.querySelectorAll('.scroll-animate, .stagger-children');

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  });

  scrollAnimateElements.forEach(el => {
    scrollObserver.observe(el);
  });

  // ========================================
  // パララックス効果（軽量版）
  // ========================================
  const parallaxElements = document.querySelectorAll('.parallax');

  if (parallaxElements.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      parallaxElements.forEach(el => {
        const speed = el.dataset.speed || 0.5;
        el.style.transform = `translateY(${scrollY * speed}px)`;
      });
    }, { passive: true });
  }

  // ========================================
  // カード3Dチルト効果
  // ========================================
  const tiltCards = document.querySelectorAll('.card-tilt');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });

  // ========================================
  // カウントアップアニメーション
  // ========================================
  const countUpElements = document.querySelectorAll('.count-up');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const endValue = parseInt(target.dataset.count) || 0;
        const duration = parseInt(target.dataset.duration) || 2000;
        animateCount(target, 0, endValue, duration);
        countObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  countUpElements.forEach(el => countObserver.observe(el));

  function animateCount(element, start, end, duration) {
    const range = end - start;
    const startTime = performance.now();

    function updateCount(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.floor(start + range * easeProgress);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    }

    requestAnimationFrame(updateCount);
  }

  // ========================================
  // マウスカーソル追従エフェクト（ヒーローセクション）
  // ========================================
  const heroSection = document.getElementById('hero');
  const heroImage = document.getElementById('hero-image');

  if (heroSection && heroImage) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      heroImage.style.transform = `scale(1.02) translate(${x * 10}px, ${y * 10}px)`;
    });

    heroSection.addEventListener('mouseleave', () => {
      heroImage.style.transform = 'scale(1) translate(0, 0)';
    });
  }

  // ========================================
  // ページ読み込みアニメーション
  // ========================================
  document.body.classList.add('page-transition');

  // ========================================
  // ヘッダースクロール効果
  // ========================================
  const header = document.querySelector('header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;

      if (currentScroll > 50) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });
  }

  // ========================================
  // 文字のタイピングエフェクト（オプション）
  // ========================================
  const typingElements = document.querySelectorAll('.typing-effect');
  typingElements.forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.style.visibility = 'visible';

    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 100);
      }
    };

    // スクロールしてビューポートに入ったら開始
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          typeWriter();
          observer.unobserve(el);
        }
      });
    });
    observer.observe(el);
  });

  // ========================================
  // マウスストーカー（デスクトップのみ）
  // ========================================
  if (window.matchMedia('(min-width: 768px)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    let cursorX = 0, cursorY = 0;
    let targetX = 0, targetY = 0;

    document.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    const updateCursor = () => {
      const diffX = targetX - cursorX;
      const diffY = targetY - cursorY;

      cursorX += diffX * 0.1;
      cursorY += diffY * 0.1;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';

      requestAnimationFrame(updateCursor);
    };
    updateCursor();

    // ホバー時にカーソルを大きく
    document.querySelectorAll('a, button, .card, .card-3d').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
    });
  }

  // ========================================
  // 画像ライトボックス
  // ========================================
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox && lightboxImg) {
    // クリック可能な画像を取得（メニューカード画像 + lightbox-triggerクラス）
    const clickableImages = document.querySelectorAll('.menu-card-image, .lightbox-trigger');

    clickableImages.forEach(img => {
      img.addEventListener('click', (e) => {
        e.preventDefault();
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.remove('hidden');
        // 少し遅延してactiveクラスを追加（アニメーション用）
        requestAnimationFrame(() => {
          lightbox.classList.add('active');
        });
        document.body.style.overflow = 'hidden';
      });
    });

    // 閉じるボタン
    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    // 背景クリックで閉じる
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        lightbox.classList.add('hidden');
        lightboxImg.src = '';
      }, 300);
    }
  }
});

// ベースパス（Vite の base 設定に対応）
const BASE_PATH = import.meta.env.BASE_URL || '/';

// ========================================
// Service Worker 登録
// ========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${BASE_PATH}sw.js`);
      console.log('Service Worker 登録成功:', registration.scope);
    } catch (error) {
      console.log('Service Worker 登録失敗:', error);
    }
  });
}

// ========================================
// PWA インストールプロンプト
// ========================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // デフォルトのプロンプトを抑制
  e.preventDefault();
  deferredPrompt = e;

  // 既に閉じたことがあるか確認（24時間以内は表示しない）
  const dismissedTime = localStorage.getItem('pwa-install-dismissed');
  if (dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) {
      return;
    }
  }

  // 3秒後にバナーを表示（ページ読み込み直後は邪魔になるため）
  setTimeout(() => {
    showInstallBanner();
  }, 3000);
});

function showInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (!banner || !deferredPrompt) return;

  banner.classList.remove('hidden');
}

function hideInstallBanner() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('hidden');
  }
}

// インストールボタン
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('pwa-install-btn');
  const closeBtn = document.getElementById('pwa-install-close');
  const laterBtn = document.getElementById('pwa-install-later');

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      // インストールプロンプトを表示
      deferredPrompt.prompt();

      // ユーザーの選択を待つ
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA インストール選択:', outcome);

      // プロンプトは一度しか使えない
      deferredPrompt = null;
      hideInstallBanner();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      hideInstallBanner();
    });
  }

  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      hideInstallBanner();
    });
  }
});

// インストール完了時
window.addEventListener('appinstalled', () => {
  console.log('PWA インストール完了');
  deferredPrompt = null;
  hideInstallBanner();
});

// メニューデータの読み込み（動的ページ用）
async function loadMenuData() {
  try {
    const response = await fetch(`${BASE_PATH}data/menu.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Failed to load menu data');
    return await response.json();
  } catch (error) {
    console.error('Error loading menu data:', error);
    return null;
  }
}

// サイト設定データの読み込み（お知らせ・日替わりメニュー）
async function loadSiteConfig() {
  try {
    const response = await fetch(`${BASE_PATH}data/site-config.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Failed to load site config');
    return await response.json();
  } catch (error) {
    console.error('Error loading site config:', error);
    return null;
  }
}

// 価格のフォーマット
function formatPrice(price) {
  return `¥${price.toLocaleString()}`;
}

// 日替わりメニューの読み込みと表示
async function loadDailyMenu() {
  const scheduleContainer = document.getElementById('daily-schedule');
  const monthElement = document.getElementById('daily-month');
  const priceElement = document.getElementById('daily-price');
  const nameElement = document.getElementById('daily-name');

  if (!scheduleContainer) return; // メニューページでない場合はスキップ

  try {
    const config = await loadSiteConfig();
    if (!config || !config.daily) throw new Error('Failed to load daily menu');
    const data = config.daily;

    // 月と価格を更新
    if (monthElement) monthElement.textContent = `${data.month}のメニュー`;
    if (priceElement) priceElement.textContent = formatPrice(data.price);
    if (nameElement) nameElement.textContent = `${data.menuName}（${data.menuReading}）`;

    // 曜日別メニューを生成
    const dayNames = { '月': '月曜日', '火': '火曜日', '水': '水曜日', '木': '木曜日', '金': '金曜日', '土': '土曜日' };

    scheduleContainer.innerHTML = data.schedule.map(day => {
      const dayLabel = dayNames[day.day] || day.day;

      if (day.note && (!day.items || day.items.length === 0)) {
        // 備考のみ（土曜日など）
        return `
          <div class="bg-white rounded-lg p-4 shadow-sm">
            <p class="font-bold text-primary-600 mb-2 text-lg">${dayLabel}</p>
            <p class="text-sm text-secondary-500 italic">${day.note}</p>
          </div>
        `;
      }

      // 通常のメニュー
      const itemsHtml = day.items.map(item => `<li>・${item}</li>`).join('');
      return `
        <div class="bg-white rounded-lg p-4 shadow-sm">
          <p class="font-bold text-primary-600 mb-2 text-lg">${dayLabel}</p>
          <ul class="text-sm text-secondary-700 space-y-1">
            ${itemsHtml}
          </ul>
          ${day.note ? `<p class="text-xs text-secondary-400 mt-2">${day.note}</p>` : ''}
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading daily menu:', error);
    scheduleContainer.innerHTML = `
      <div class="bg-white rounded-lg p-4 shadow-sm col-span-full text-center">
        <p class="text-secondary-500">メニューの読み込みに失敗しました。<br>お電話にてご確認ください。</p>
      </div>
    `;
  }
}

// ページ読み込み時に日替わりメニューとお知らせを読み込む
document.addEventListener('DOMContentLoaded', () => {
  loadDailyMenu();
  loadLatestNews();
});

// 最新のお知らせをティッカーに表示
async function loadLatestNews() {
  const newsTicker = document.getElementById('news-ticker');
  if (!newsTicker) return; // TOPページ以外はスキップ

  const tickerContent = document.getElementById('news-ticker-content');
  const categoryElement = document.getElementById('ticker-category');
  const dateElement = document.getElementById('ticker-date');
  const titleElement = document.getElementById('ticker-title');
  const bodyElement = document.getElementById('ticker-body');

  try {
    const config = await loadSiteConfig();
    if (!config || !config.news) throw new Error('Failed to load news');
    const data = config.news;

    // カテゴリ表示
    const categoryLabels = {
      'news': 'お知らせ',
      'new_menu': '新メニュー',
      'holiday': '休業日',
      'campaign': 'キャンペーン'
    };
    if (categoryElement) {
      categoryElement.textContent = categoryLabels[data.category] || 'お知らせ';
    }

    // 日付フォーマット
    if (dateElement && data.date) {
      const date = new Date(data.date);
      const formatted = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
      dateElement.textContent = formatted;
    }

    // タイトル
    if (titleElement) {
      titleElement.textContent = data.title;
    }

    // 本文（全文表示）
    if (bodyElement && data.body) {
      bodyElement.textContent = data.body;
    }

    // ティッカーを複数複製して途切れない無限ループにする
    const tickerWrapper = document.getElementById('news-ticker-wrapper');
    if (tickerContent && tickerWrapper) {
      // コンテンツ幅を取得
      const contentWidth = tickerContent.offsetWidth;

      // 速度調整: より速く（12秒ベース、コンテンツ幅に応じて調整）
      const duration = Math.max(10, contentWidth / 100);
      tickerContent.style.setProperty('--ticker-duration', `${duration}s`);

      // 画面幅に応じて必要な数だけ複製（シームレスループのため）
      const screenWidth = window.innerWidth;
      const clonesNeeded = Math.max(2, Math.ceil(screenWidth / contentWidth) + 1);

      for (let i = 0; i < clonesNeeded; i++) {
        const clone = tickerContent.cloneNode(true);
        clone.removeAttribute('id');
        // クローンのID付き要素からIDを削除
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.style.setProperty('--ticker-duration', `${duration}s`);
        tickerWrapper.appendChild(clone);
      }
    }

  } catch (error) {
    console.error('Error loading news:', error);
    // エラー時はティッカーを非表示にする
    newsTicker.style.display = 'none';
  }
}

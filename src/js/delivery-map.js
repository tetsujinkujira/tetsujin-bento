import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

  (function() {
    var mapEl = document.getElementById('delivery-map');
    if (!mapEl) return;

    var map = L.map('delivery-map', {
      scrollWheelZoom: false,
      tap: false
    }).setView([35.6555, 139.7500], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map);

    // ティアごとの配達エリア（おおよその境界）
    // 外側（高額）から内側（低額）の順に描画し、内側が上に表示される
    var tiers = [
      {
        label: '3,000円〜',
        color: '#4b5563',
        coords: [
          [35.6900, 139.7350], [35.6895, 139.7450], [35.6870, 139.7550],
          [35.6800, 139.7650], [35.6700, 139.7750], [35.6600, 139.7850],
          [35.6450, 139.7900], [35.6300, 139.7870], [35.6100, 139.7500],
          [35.6100, 139.7400], [35.6180, 139.7120], [35.6350, 139.7130],
          [35.6500, 139.7150], [35.6700, 139.7170], [35.6800, 139.7250]
        ]
      },
      {
        label: '2,500円〜',
        color: '#ea580c',
        coords: [
          [35.6860, 139.7360], [35.6850, 139.7460], [35.6830, 139.7560],
          [35.6750, 139.7650], [35.6680, 139.7740], [35.6600, 139.7830],
          [35.6430, 139.7870], [35.6310, 139.7840], [35.6180, 139.7530],
          [35.6180, 139.7400], [35.6250, 139.7180], [35.6350, 139.7180],
          [35.6500, 139.7180], [35.6680, 139.7200], [35.6780, 139.7280]
        ]
      },
      {
        label: '2,000円〜',
        color: '#f59e0b',
        coords: [
          [35.6840, 139.7400], [35.6830, 139.7500], [35.6800, 139.7580],
          [35.6720, 139.7650], [35.6620, 139.7720], [35.6560, 139.7790],
          [35.6430, 139.7790], [35.6320, 139.7700], [35.6180, 139.7530],
          [35.6200, 139.7400], [35.6280, 139.7220], [35.6380, 139.7220],
          [35.6500, 139.7210], [35.6650, 139.7230], [35.6750, 139.7310]
        ]
      },
      {
        label: '1,400円〜',
        color: '#ef4444',
        coords: [
          [35.6820, 139.7380], [35.6830, 139.7500], [35.6870, 139.7640],
          [35.6830, 139.7680], [35.6700, 139.7750], [35.6630, 139.7730],
          [35.6560, 139.7700], [35.6420, 139.7570], [35.6350, 139.7460],
          [35.6350, 139.7350], [35.6380, 139.7260], [35.6450, 139.7220],
          [35.6550, 139.7220], [35.6650, 139.7230], [35.6730, 139.7280],
          [35.6790, 139.7320]
        ]
      },
      {
        label: '700円〜',
        color: '#dc2626',
        coords: [
          [35.6770, 139.7380], [35.6770, 139.7490], [35.6760, 139.7560],
          [35.6750, 139.7640], [35.6700, 139.7690], [35.6640, 139.7700],
          [35.6580, 139.7650], [35.6500, 139.7620], [35.6430, 139.7570],
          [35.6430, 139.7490], [35.6450, 139.7420], [35.6480, 139.7370],
          [35.6530, 139.7340], [35.6580, 139.7320], [35.6640, 139.7300],
          [35.6700, 139.7310], [35.6740, 139.7340]
        ]
      }
    ];

    tiers.forEach(function(tier) {
      L.polygon(tier.coords, {
        color: tier.color,
        weight: 2,
        fillColor: tier.color,
        fillOpacity: 0.18
      }).addTo(map).bindPopup(Object.assign(document.createElement('strong'), { textContent: tier.label }));
    });

    // 店舗マーカー
    var storeIcon = L.divIcon({
      className: '',
      html: '<div style="background:#dc2626;color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);">鉄人</div>',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([35.6553, 139.7507], { icon: storeIcon })
      .addTo(map)
      .bindPopup('<strong>新橋店</strong><br>港区新橋6-16-4<br>TEL: 03-3432-3720');

    // 凡例
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function() {
      var div = L.DomUtil.create('div');
      div.style.cssText = 'background:#fff;padding:10px 14px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:12px;line-height:1.8;';
      div.innerHTML =
        '<div style="font-weight:700;margin-bottom:4px;">最低注文金額</div>' +
        '<div><span style="display:inline-block;width:14px;height:14px;background:#dc2626;border-radius:3px;vertical-align:middle;margin-right:6px;opacity:.6;"></span>700円〜</div>' +
        '<div><span style="display:inline-block;width:14px;height:14px;background:#ef4444;border-radius:3px;vertical-align:middle;margin-right:6px;opacity:.6;"></span>1,400円〜</div>' +
        '<div><span style="display:inline-block;width:14px;height:14px;background:#f59e0b;border-radius:3px;vertical-align:middle;margin-right:6px;opacity:.6;"></span>2,000円〜</div>' +
        '<div><span style="display:inline-block;width:14px;height:14px;background:#ea580c;border-radius:3px;vertical-align:middle;margin-right:6px;opacity:.6;"></span>2,500円〜</div>' +
        '<div><span style="display:inline-block;width:14px;height:14px;background:#4b5563;border-radius:3px;vertical-align:middle;margin-right:6px;opacity:.6;"></span>3,000円〜</div>';
      return div;
    };
    legend.addTo(map);
  })();

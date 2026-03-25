// Banner images in /public/banner/.
// Rotation is deterministic: (year * 12 + month) % BANNERS.length
// — no cron job required. The image advances automatically on the 1st of each month.
// To add a new image: drop the file into /public/banner/ and add its filename to BANNERS below.
// See docs/BANNER_ROTATION.md for full operational details.

const BANNERS = [
  'banner1.png',
  'banner2.png',
  'banner3.png',
  'banner4.png',
  'banner5.png',
  'banner6.png',
  'banner7.png',
  'banner8.png',
  'banner9.png',
  'banner10.png',
  'monsters_eat_austin.png',
];

function getCurrentBanner() {
  const now = new Date();
  const index = (now.getFullYear() * 12 + now.getMonth()) % BANNERS.length;
  return `/banner/${BANNERS[index]}`;
}

export default function Home() {
  const bannerSrc = getCurrentBanner();

  return (
    <div className="w-full">
      <div className="w-full">
        <img
          src={bannerSrc}
          alt="Banner"
          className="w-full object-cover"
          style={{ display: 'block', maxHeight: '80vh' }}
        />
      </div>
    </div>
  );
}

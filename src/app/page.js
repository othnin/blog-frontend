import HomepageContent from '@/components/HomepageContent'

// Banner images in /public/banner/.
// Rotation is deterministic: (year * 12 + month) % BANNERS.length
// — no cron job required. The image advances automatically on the 1st of each month.
// To add a new image: drop the file into /public/banner/ and add its filename to BANNERS below.
// See docs/BANNER_ROTATION.md for full operational details.

const BANNERS = [
  'banner1.webp',
  'banner2.webp',
  'banner3.webp',
  'banner4.webp',
  'banner5.webp',
  'banner6.webp',
  'banner7.webp',
  'banner8.webp',
  'banner9.webp',
  'banner10.webp',
  'banner11.webp',
  'banner12.webp',
  'banner13.webp',
  'monsters_eat_austin.webp',
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
      <div className="w-full overflow-hidden">
        <img
          src={bannerSrc}
          alt=""
          width={1920}
          height={600}
          className="block h-auto w-full object-cover object-center aspect-video md:aspect-[16/5] max-h-[560px]"
        />
      </div>
      <HomepageContent />
    </div>
  );
}

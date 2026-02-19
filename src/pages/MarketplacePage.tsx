import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RefreshCw, ExternalLink, ShoppingCart, Leaf, PawPrint, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMarketPrices, useRefreshMarketPrices, useEssentialPrices } from '@/hooks/useMarketPrices';

const farmerEssentials = [
  {
    category_bn: 'সার (Fertilizer)',
    category_en: 'Fertilizers',
    icon: 'leaf',
    items: [
      { name_bn: 'ইউরিয়া সার', name_en: 'Urea Fertilizer', desc_bn: 'নাইট্রোজেন সমৃদ্ধ — ফসলের বৃদ্ধিতে অপরিহার্য', desc_en: 'Nitrogen-rich, essential for crop growth', link: 'https://www.daraz.com.bd/catalog/?q=urea+fertilizer', store: 'Daraz' },
      { name_bn: 'টিএসপি সার', name_en: 'TSP Fertilizer', desc_bn: 'ফসফরাস সমৃদ্ধ — শিকড় ও ফুলের বিকাশে', desc_en: 'Phosphorus-rich for root & flower development', link: 'https://www.daraz.com.bd/catalog/?q=tsp+fertilizer', store: 'Daraz' },
      { name_bn: 'এমওপি / পটাশ সার', name_en: 'MOP / Potash', desc_bn: 'পটাসিয়াম — ফলের মান বৃদ্ধি করে', desc_en: 'Potassium for fruit quality improvement', link: 'https://www.daraz.com.bd/catalog/?q=potash+fertilizer', store: 'Daraz' },
      { name_bn: 'ডিএপি সার', name_en: 'DAP Fertilizer', desc_bn: 'নাইট্রোজেন ও ফসফরাস — চারা রোপণে আদর্শ', desc_en: 'N+P combined, ideal for planting', link: 'https://www.daraz.com.bd/catalog/?q=dap+fertilizer', store: 'Daraz' },
      { name_bn: 'জৈব সার / কম্পোস্ট', name_en: 'Organic Compost', desc_bn: 'মাটির স্বাস্থ্য ও উর্বরতা বৃদ্ধি করে', desc_en: 'Improves soil health and fertility', link: 'https://www.daraz.com.bd/catalog/?q=organic+compost+fertilizer', store: 'Daraz' },
      { name_bn: 'জিপসাম সার', name_en: 'Gypsum Fertilizer', desc_bn: 'সালফার সমৃদ্ধ — সরিষা ও তৈলবীজের জন্য', desc_en: 'Sulfur-rich for mustard & oilseeds', link: 'https://www.daraz.com.bd/catalog/?q=gypsum+fertilizer', store: 'Daraz' },
    ],
  },
  {
    category_bn: 'পশু খাদ্য (Animal Feed)',
    category_en: 'Animal Feed',
    icon: 'paw',
    items: [
      { name_bn: 'গরুর দানাদার খাদ্য', name_en: 'Cattle Feed Mix', desc_bn: 'প্রোটিন ও ভিটামিন সমৃদ্ধ — দুধ ও মাংস উৎপাদনে', desc_en: 'Protein & vitamin-rich for milk/meat', link: 'https://www.daraz.com.bd/catalog/?q=cattle+feed', store: 'Daraz' },
      { name_bn: 'মুরগির খাদ্য - লেয়ার', name_en: 'Layer Chicken Feed', desc_bn: 'ডিম উৎপাদন বৃদ্ধিতে বিশেষ ফর্মুলা', desc_en: 'Special formula for egg production', link: 'https://www.daraz.com.bd/catalog/?q=layer+chicken+feed', store: 'Daraz' },
      { name_bn: 'মুরগির খাদ্য - ব্রয়লার', name_en: 'Broiler Chicken Feed', desc_bn: 'দ্রুত ওজন বৃদ্ধিতে সহায়ক', desc_en: 'Fast weight gain for broilers', link: 'https://www.daraz.com.bd/catalog/?q=broiler+feed', store: 'Daraz' },
      { name_bn: 'ছাগলের খাদ্য', name_en: 'Goat Feed', desc_bn: 'ছাগলের পুষ্টি ও স্বাস্থ্য রক্ষায়', desc_en: 'Nutrition and health for goats', link: 'https://www.daraz.com.bd/catalog/?q=goat+feed', store: 'Daraz' },
      { name_bn: 'মাছের খাদ্য', name_en: 'Fish Feed', desc_bn: 'পুকুরের মাছের দ্রুত বৃদ্ধিতে', desc_en: 'Fast growth for pond fish', link: 'https://www.daraz.com.bd/catalog/?q=fish+feed+bangladesh', store: 'Daraz' },
      { name_bn: 'হাঁসের খাদ্য', name_en: 'Duck Feed', desc_bn: 'হাঁসের ডিম ও মাংস উৎপাদনে', desc_en: 'For duck egg & meat production', link: 'https://www.daraz.com.bd/catalog/?q=duck+feed', store: 'Daraz' },
    ],
  },
  {
    category_bn: 'কৃষি ওষুধ ও কীটনাশক',
    category_en: 'Pesticides & Medicine',
    icon: 'flask',
    items: [
      { name_bn: 'ফসলের কীটনাশক', name_en: 'Crop Pesticide', desc_bn: 'পোকামাকড় থেকে ফসল রক্ষা করুন', desc_en: 'Protect crops from pest damage', link: 'https://www.daraz.com.bd/catalog/?q=crop+pesticide', store: 'Daraz' },
      { name_bn: 'ছত্রাকনাশক', name_en: 'Fungicide', desc_bn: 'ফসলের ছত্রাক রোগ প্রতিরোধে', desc_en: 'Prevent fungal diseases in crops', link: 'https://www.daraz.com.bd/catalog/?q=fungicide+agriculture', store: 'Daraz' },
      { name_bn: 'পশু ভিটামিন ও ওষুধ', name_en: 'Animal Vitamins', desc_bn: 'পশুর স্বাস্থ্য ও রোগ প্রতিরোধে', desc_en: 'Animal health & disease prevention', link: 'https://www.daraz.com.bd/catalog/?q=animal+vitamin+livestock', store: 'Daraz' },
      { name_bn: 'আগাছানাশক', name_en: 'Herbicide', desc_bn: 'জমির আগাছা দমনে কার্যকর', desc_en: 'Effective weed control', link: 'https://www.daraz.com.bd/catalog/?q=herbicide+agriculture', store: 'Daraz' },
    ],
  },
];

const CategoryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'leaf': return <Leaf className="w-6 h-6 text-primary" />;
    case 'paw': return <PawPrint className="w-6 h-6 text-primary" />;
    case 'flask': return <FlaskConical className="w-6 h-6 text-primary" />;
    default: return <ShoppingCart className="w-6 h-6 text-primary" />;
  }
};

export function MarketplacePage() {
  const { language } = useLanguage();
  const { data: prices, isLoading } = useMarketPrices();
  const refreshPrices = useRefreshMarketPrices();
  const bn = language === 'bn';

  // Auto-refresh prices on every visit
  useEffect(() => {
    refreshPrices.mutate();
  }, []);

  const getProductEmoji = (product: string) => {
    const lower = product.toLowerCase();
    if (lower.includes('ধান') || lower.includes('paddy') || lower.includes('rice') || lower.includes('চাল')) return '🌾';
    if (lower.includes('গম') || lower.includes('wheat')) return '🌿';
    if (lower.includes('ভুট্টা') || lower.includes('corn')) return '🌽';
    if (lower.includes('পেঁয়াজ') || lower.includes('onion')) return '🧅';
    if (lower.includes('আলু') || lower.includes('potato')) return '🥔';
    if (lower.includes('টমেটো') || lower.includes('tomato')) return '🍅';
    if (lower.includes('মরিচ') || lower.includes('chili')) return '🌶️';
    if (lower.includes('বেগুন') || lower.includes('eggplant')) return '🍆';
    if (lower.includes('দুধ') || lower.includes('milk')) return '🥛';
    if (lower.includes('ডিম') || lower.includes('egg')) return '🥚';
    if (lower.includes('মুরগি') || lower.includes('chicken')) return '🐔';
    if (lower.includes('গরু') || lower.includes('beef')) return '🐄';
    if (lower.includes('মাছ') || lower.includes('fish')) return '🐟';
    if (lower.includes('রসুন') || lower.includes('garlic')) return '🧄';
    if (lower.includes('আদা') || lower.includes('ginger')) return '🫚';
    if (lower.includes('হলুদ') || lower.includes('turmeric')) return '🟡';
    if (lower.includes('ডাল') || lower.includes('lentil')) return '🫘';
    if (lower.includes('সরিষা') || lower.includes('mustard') || lower.includes('তেল') || lower.includes('oil')) return '🫗';
    if (lower.includes('পাট') || lower.includes('jute')) return '🌿';
    return '📦';
  };

  const loading = isLoading || (refreshPrices.isPending && (!prices || prices.length === 0));

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          🛒 {bn ? 'বাজার দর' : 'Market Prices'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {bn ? 'আজকের পণ্যের বাজার মূল্য — স্বয়ংক্রিয়ভাবে আপডেট হয়' : "Today's market prices — auto-updated"}
          {refreshPrices.isPending && (
            <span className="inline-flex items-center gap-1 ml-2 text-primary">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {bn ? 'আপডেট হচ্ছে...' : 'Updating...'}
            </span>
          )}
        </p>
      </div>

      {/* Market Prices Section */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p>{bn ? 'বাজার দর লোড হচ্ছে...' : 'Loading market prices...'}</p>
        </div>
      ) : !prices || prices.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl mb-4 block">📊</span>
          <p className="text-muted-foreground">{bn ? 'বাজার দর পাওয়া যায়নি' : 'No market prices available'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {prices.map((price, index) => (
            <div key={price.id} className="bg-card rounded-2xl p-5 border border-border card-interactive animate-fade-in" style={{ animationDelay: `${(index + 2) * 50}ms` }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-card flex items-center justify-center shadow-sm">
                  <span className="text-3xl">{getProductEmoji(price.product)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{price.product}</h3>
                  <p className="text-xs text-muted-foreground">{bn ? 'প্রতি' : 'per'} {price.unit}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-primary">৳{Number(price.price).toLocaleString()}</p>
                {price.source && <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{price.source}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {bn ? 'আপডেট:' : 'Updated:'} {new Date(price.recorded_at).toLocaleDateString(bn ? 'bn-BD' : 'en-US')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Farmer Essentials Section */}
      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {bn ? 'কৃষকের প্রয়োজনীয় পণ্য' : 'Farmer Essentials'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {bn ? 'সার, পশু খাদ্য ও কৃষি ওষুধ — সেরা দামে কিনুন' : 'Fertilizers, animal feed & agri-medicine — buy at best prices'}
          </p>
        </div>

        {farmerEssentials.map((category, catIdx) => (
          <div key={catIdx} className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CategoryIcon type={category.icon} />
              {bn ? category.category_bn : category.category_en}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.items.map((item, itemIdx) => {
                return (
                  <div
                    key={itemIdx}
                    className="bg-card rounded-xl p-4 border border-border hover:border-primary/40 transition-all duration-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground">{bn ? item.name_bn : item.name_en}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{bn ? item.desc_bn : item.desc_en}</p>
                    </div>
                    <div className="flex items-center justify-end">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {bn ? 'কিনুন' : 'Buy'}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { create } from 'zustand';

export const useAppStore = create((set) => ({
  activeOverlay: null,
  isOverlayOpen: false,
  
  overlays: {
    services: {
      title: "🔧 Services",
      icon: "🛠️",
      content: [
        {
          title: "Weapon Crafting & Upgrades",
          description: "From iron daggers to enchanted broadswords – choose your weapon type, material, and finish."
        },
        {
          title: "Tool Forging",
          description: "Axes, pickaxes, watering cans – upgrade tools for better durability and effectiveness."
        },
        {
          title: "Custom Orders",
          description: "Submit a special request for a personalized item. Requires approval and may include extra charges."
        },
        {
          title: "Item Restoration",
          description: "Repair or restore old weapons and tools. Perfect for heirloom pieces or broken gear."
        },
        {
          title: "Armor Fitting",
          description: "Light and heavy armor sets available. Fully customizable by size, material, and design."
        },
        {
          title: "Decorative Metalwork",
          description: "Commission artistic pieces – signs, sculptures, or themed home decor made from premium metals."
        }
      ]
    },
    events: {
      title: "🎉 Events",
      icon: "📅",
      content: [
        {
          title: "Forge Fest – Summer Edition",
          description: "Live demonstrations, discounts, and a forging contest where players vote for the best custom design!"
        },
        {
          title: "Meet the Masters",
          description: "Weekly livestream/Q&A with Master Blacksmiths. Learn about forging techniques and item lore."
        },
        {
          title: "Customer Showcase",
          description: "Monthly highlight of the best custom orders – submit your gear for a chance to be featured and win store credit."
        },
        {
          title: "Inventory Auction Days",
          description: "Rare materials and discontinued items sold at auction – limited time and stock!"
        },
        {
          title: "Barter Bonanza",
          description: "Special barter-only event – bring your in-game goods and trade them for select blacksmith services!"
        }
      ]
    },
    promos: {
      title: "🌟 Promos",
      icon: "💰",
      content: [
        {
          title: "New Season Forge Sale!",
          description: "Get 10% off all tool upgrades until the end of Spring!"
        },
        {
          title: "First-Time Customer Discount",
          description: "Enjoy 15% off your first order – whether it's a sword, horseshoe, or custom armor!"
        },
        {
          title: "Masterwork Mondays",
          description: "Every Monday, Master Blacksmith-crafted items are 20% off (limited slots!)."
        },
        {
          title: "Bundle Bonanza",
          description: "Order 3 or more items and get a free customization upgrade (gem inlay, engraving, etc.)."
        },
        {
          title: "Rush Hour Special",
          description: "Rush order fee waived for the first 5 customers every Friday!"
        }
      ]
    }
  },
  
  openOverlay: (overlayName) => set({ 
    activeOverlay: overlayName, 
    isOverlayOpen: true 
  }),
  closeOverlay: () => set({ isOverlayOpen: false })
}));
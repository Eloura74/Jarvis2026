#include "DisplayCore.h"

LGFX::LGFX() {
    {
      auto cfg = _bus.config();
      cfg.spi_host    = SPI2_HOST; 
      cfg.spi_mode    = 0;
      cfg.freq_write  = 80000000; // 80 MHz
      cfg.spi_3wire   = true;
      cfg.use_lock    = true;
      cfg.dma_channel = SPI_DMA_CH_AUTO;

      // PINS SPI GC9A01
      cfg.pin_sclk = 12; 
      cfg.pin_mosi = 11; 
      cfg.pin_miso = -1; 
      cfg.pin_dc   = 9;  
      _bus.config(cfg);
      _panel.setBus(&_bus);
    }
    {
      auto cfg = _panel.config();
      cfg.pin_cs   = 10; 
      cfg.pin_rst  = 8;  
      cfg.pin_busy = -1;
      cfg.memory_width  = 240;
      cfg.memory_height = 240;
      cfg.panel_width   = 240;
      cfg.panel_height  = 240;
      cfg.offset_x = 0;
      cfg.offset_y = 0;
      cfg.invert    = true;
      cfg.rgb_order = false;
      _panel.config(cfg);
    }
    setPanel(&_panel);
}

// Implémentation globale
LGFX display;
lgfx::LGFX_Sprite spr(&display);

void initDisplay() {
  display.init();
  display.setRotation(0); 

  spr.createSprite(240, 240);
  spr.setSwapBytes(true); 
}

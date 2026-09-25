"use client";

import * as React from "react";
import { SHOWROOMS } from "@/data/mock-products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, QrCode, MapPin, Phone, Clock, ArrowRight, Sparkles } from "lucide-react";

export function OmnichannelSection() {
  const [selectedShowroom, setSelectedShowroom] = React.useState(SHOWROOMS[0].id);

  return (
    <section id="showrooms" className="w-full py-16 sm:py-20 bg-[#F4F2EF] border-y border-[#E5E0DA]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF9F7] border border-[#E5E0DA] text-[#8B5E3C] text-xs font-semibold uppercase tracking-wider">
            <Store className="w-3.5 h-3.5" />
            <span>Omnichannel Experience Centers</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#24211E] font-medium tracking-tight">
            Touch it in Showroom. <br />
            Preview it in your Living Room.
          </h2>
          <p className="text-sm sm:text-base text-[#6F6A64]">
            Feel the natural grain of solid timber and test cushion firmness at our flagship galleries. Then use our Store-Assisted AR QR codes to visualize that exact piece at home before deciding.
          </p>
        </div>

        {/* 3-Step Omnichannel Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[16px] p-6 border border-[#E5E0DA] shadow-card space-y-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center font-serif font-bold text-lg">
              1
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#24211E]">Visit Our Design Showrooms</h3>
            <p className="text-xs text-[#6F6A64] leading-relaxed">
              Explore curated room setups in Delhi and Jalandhar with assistance from our interior design specialists.
            </p>
          </div>

          <div className="bg-white rounded-[16px] p-6 border border-[#8B5E3C]/30 shadow-card space-y-3 relative overflow-hidden">
            <div className="w-10 h-10 rounded-[10px] bg-[#8B5E3C] text-white flex items-center justify-center font-serif font-bold text-lg">
              2
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#24211E]">Scan Product Floor QR</h3>
            <p className="text-xs text-[#6F6A64] leading-relaxed">
              Every display item includes a QR tag. Scan with your phone to instantly load the 3D model into your pocket.
            </p>
            <div className="absolute top-4 right-4 text-[#8B5E3C]/30">
              <QrCode className="w-8 h-8" />
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-6 border border-[#E5E0DA] shadow-card space-y-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#F3E8DE] text-[#8B5E3C] flex items-center justify-center font-serif font-bold text-lg">
              3
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#24211E]">Unified Stock & In-Home Setup</h3>
            <p className="text-xs text-[#6F6A64] leading-relaxed">
              Check out in-store or online with shared real-time inventory. Complimentary white-glove assembly guaranteed.
            </p>
          </div>
        </div>

        {/* Showrooms Locations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {SHOWROOMS.map((showroom) => (
            <div
              key={showroom.id}
              className={`bg-white rounded-[16px] p-6 border transition-all duration-200 flex flex-col justify-between gap-6 ${
                selectedShowroom === showroom.id
                  ? "border-[#8B5E3C] shadow-card-hover"
                  : "border-[#E5E0DA] shadow-card hover:border-[#8B5E3C]/40"
              }`}
              onClick={() => setSelectedShowroom(showroom.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-[#8B5E3C] uppercase tracking-wider">
                      {showroom.city}
                    </span>
                    <h4 className="font-serif text-xl font-medium text-[#24211E] mt-0.5">
                      {showroom.name}
                    </h4>
                  </div>
                  {showroom.hasArStudio && (
                    <Badge variant="ar" size="sm">AR Studio</Badge>
                  )}
                </div>

                <div className="space-y-2 text-xs text-[#6F6A64]">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#8B5E3C] shrink-0 mt-0.5" />
                    <span>{showroom.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                    <span>{showroom.timing}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#8B5E3C] shrink-0" />
                    <span>{showroom.phone}</span>
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0DA]">
                <Button variant="outline" size="sm" className="w-full text-xs hover:border-[#8B5E3C]">
                  <span>Book In-Store Design Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Table } from "antd";
import type { ColumnType } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";

interface DataTuru {
  key: React.Key;
  isim: string;
  yas: number;
  adres: string;
  telefon: string;
}

const sutunlar: ColumnType<DataTuru>[] = [
  { title: "İsim", dataIndex: "isim", key: "isim", width: "25%" },
  { title: "Yaş", dataIndex: "yas", key: "yas", width: "10%" },
  { title: "Adres", dataIndex: "adres", key: "adres", width: "40%" },
  { title: "Telefon", dataIndex: "telefon", key: "telefon", width: "20%" },
];

const tumData: DataTuru[] = Array.from({ length: 50 }, (_, i) => ({
  key: i,
  isim: `Nuri Can Birdemir ${i + 1}`,
  yas: 11 + i,
  adres: `Hadımköy, Baykar Özdemir Bayraktar Merkezi . ${i + 1}`,
  telefon: `0512 345 789${(i + 1) % 10}`,
})).sort(() => Math.random() - 0.5);

const TabloExcel: React.FC<ColumnType> = () => {
  const [state, setState] = useState({
    secilenHucreler: new Set(),
    gecerliSayfa: 1,
    sayfaBoyutu: 10,
    seciliyorMu: false,
    baslangicHucresi: null as { satir: number; sutun: number } | null,
    shiftBasiliMi: false,
    yukleniyor: false,
    seciliSatirAnahtarlari: [] as React.Key[],
    seciliSatirData: [] as DataTuru[],
    aktifHucre: { satir: 0, sutun: 0 },
  });

  const tabloRef = useRef<HTMLDivElement>(null);

  const stateGuncelle = useCallback((yeniState: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...yeniState }));
  }, []);

  const kaynakData = useMemo(() => {
    const baslangicIndex = (state.gecerliSayfa - 1) * state.sayfaBoyutu;
    return tumData.slice(
      baslangicIndex,
      baslangicIndex + state.sayfaBoyutu
    );
  }, [state.gecerliSayfa, state.sayfaBoyutu, tumData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: true });
      if (event.ctrlKey && event.key === "c") kopyala();
      handleArrowKeys(event);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: false });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [state.secilenHucreler, state.seciliSatirAnahtarlari, state.aktifHucre]);

  const handleArrowKeys = (event: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const { satir, sutun } = state.aktifHucre;
      let yeniSatir = satir;
      let yeniSutun = sutun;

      switch (event.key) {
        case "ArrowUp":
          yeniSatir = Math.max(0, satir - 1);
          break;
        case "ArrowDown":
          yeniSatir = Math.min(kaynakData.length - 1, satir + 1);
          break;
        case "ArrowLeft":
          yeniSutun = Math.max(0, sutun - 1);
          break;
        case "ArrowRight":
          yeniSutun = Math.min(sutunlar.length - 1, sutun + 1);
          break;
      }

      stateGuncelle({ aktifHucre: { satir: yeniSatir, sutun: yeniSutun } });
      seciliHucreleriGuncelle(yeniSatir, yeniSutun, event.shiftKey);
      hucreGoruntule(yeniSatir, yeniSutun);
    }
  };

  const seciliHucreleriGuncelle = (satir: number, sutun: number, shiftBasili: boolean) => {
    if (!shiftBasili) {
      const yeniSecilenHucreler = new Set([`${kaynakData[satir].key}-${sutunlar[sutun].dataIndex}`]);
      stateGuncelle({ secilenHucreler: yeniSecilenHucreler });
    } else {
      aralikSecimiYap(state.baslangicHucresi || { satir, sutun }, { satir, sutun });
    }
  };

  const hucreGoruntule = (satir: number, sutun: number) => {
    if (tabloRef.current) {
      const hucre = tabloRef.current.querySelector(`[data-row-key="${kaynakData[satir].key}"] td:nth-child(${sutun + 2})`);
      if (hucre) {
        hucre.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  useEffect(() => {
    if (state.secilenHucreler.size > 0 || state.seciliSatirData.length > 0) {
      localStorage.setItem(
        "tabloVerileri",
        JSON.stringify({
          secilenHucreler: Array.from(state.secilenHucreler),
          seciliSatirlar: state.seciliSatirData,
          gecerliSayfa: state.gecerliSayfa,
          sayfaBoyutu: state.sayfaBoyutu,
        })
      );
    }
  }, [
    state.secilenHucreler,
    state.seciliSatirData,
    state.gecerliSayfa,
    state.sayfaBoyutu,
  ]);

  useEffect(() => {
    const kayitliVeriler = localStorage.getItem("tabloVerileri");
    if (kayitliVeriler) {
      const {
        secilenHucreler,
        seciliSatirlar,
        gecerliSayfa: kayitliSayfa,
        sayfaBoyutu: kayitliBoyut,
      } = JSON.parse(kayitliVeriler);
      stateGuncelle({
        secilenHucreler: new Set(secilenHucreler),
        seciliSatirData: seciliSatirlar,
        seciliSatirAnahtarlari: seciliSatirlar.map(
          (item: DataTuru) => item.key
        ),
        gecerliSayfa: kayitliSayfa,
        sayfaBoyutu: kayitliBoyut,
      });
    }
  }, []);

  const sayfalandirmaDegisikligi = useCallback(
    (sayfa: number, boyut?: number) => {
      stateGuncelle({
        yukleniyor: true,
        gecerliSayfa: sayfa,
        sayfaBoyutu: boyut || state.sayfaBoyutu,
      });
      setTimeout(() => stateGuncelle({ yukleniyor: false }), 500);
    },
    [state.sayfaBoyutu]
  );

  const hucreMouseDown = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (!state.shiftBasiliMi) {
      stateGuncelle({  secilenHucreler: new Set() });
    }
    stateGuncelle({   
      seciliyorMu: true,
      baslangicHucresi: {
        satir: tumData.findIndex((item) => item.key === veri.key),
        sutun: sutunlar.findIndex((sutun) => sutun.dataIndex === sutunKey),
      },});

    hucreSeciminidegistir(veri, sutunKey);
  };

  const hucreMouseOver = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (state.seciliyorMu && state.baslangicHucresi) {
      const bitisSatir = tumData.findIndex(
        (item) => item.key === veri.key
      );
      const bitisSutun = sutunlar.findIndex(
        (sutun) => sutun.dataIndex === sutunKey
      );
      aralikSecimiYap(state.baslangicHucresi, {
        satir: bitisSatir,
        sutun: bitisSutun,
      });
    }
  };

  const hucreMouseUp = () => {
    stateGuncelle({  seciliyorMu: false, baslangicHucresi: null, });
  };

  const hucreSeciminidegistir = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    const hucreKey = `${veri.key}-${sutunKey}`;
    setState((prevState) => {
      const yeniSet = new Set(prevState.secilenHucreler);
      yeniSet.has(hucreKey)
        ? yeniSet.delete(hucreKey)
        : yeniSet.add(hucreKey);
      return {
        ...prevState,
        secilenHucreler: yeniSet,
      };
    });
  };


  const aralikSecimiYap = (
    baslangic: { satir: number; sutun: number },
    bitis: { satir: number; sutun: number }
  ) => {
    const minSatir = Math.min(baslangic.satir, bitis.satir);
    const maxSatir = Math.max(baslangic.satir, bitis.satir);
    const minSutun = Math.min(baslangic.sutun, bitis.sutun);
    const maxSutun = Math.max(baslangic.sutun, bitis.sutun);

    const yeniSecimler = new Set(state.secilenHucreler);

    for (let satir = minSatir; satir <= maxSatir; satir++) {
      for (let sutun = minSutun; sutun <= maxSutun; sutun++) {
        const veri = tumData[satir];
        const sutunKey = sutunlar[sutun].dataIndex;
        const hucreKey = `${veri.key}-${sutunKey}`;
        yeniSecimler.add(hucreKey);
      }
    }
    stateGuncelle({ secilenHucreler: yeniSecimler });
  };

  const hucreSeciliMi = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    return state.secilenHucreler.has(`${veri.key}-${sutunKey}`);
  };

  const kopyala = () => {
    const satirSutunGruplari: { [satir: number]: string[] } = {};
    tumData.forEach((veri, satirIndex) => {
      sutunlar.forEach((sutun, sutunIndex) => {
        const sutunKey = sutun.dataIndex as keyof DataTuru;
        const hucreDegeri = veri[sutunKey].toString();
        const hucreKey = `${veri.key}-${sutunKey}`;
        if (
          state.secilenHucreler.has(hucreKey) ||
          state.seciliSatirAnahtarlari.includes(veri.key)
        ) {
          if (!satirSutunGruplari[satirIndex])
            satirSutunGruplari[satirIndex] = [];
          satirSutunGruplari[satirIndex][sutunIndex] = hucreDegeri;
        }
      });
    });
  
    const tabloMetni = Object.values(satirSutunGruplari)
      .map(satir => {
        const doluDegerler = satir.filter(deger => deger !== undefined && deger !== '');
        return doluDegerler.join('\t');
      })
      .filter(satir => satir.length > 0)
      .join('\n');
  
    console.log('tabloMetni', tabloMetni);
    navigator.clipboard
      .writeText(tabloMetni)
      .then(() => alert("Veriler kopyalandı!"));
  };

  const sutunBaslikTiklama = (sutunKey: keyof DataTuru) => {
    const yeniSeciliHucreler = new Set(state.secilenHucreler);
    const tumSecilenler = tumData.every((veri) =>
      yeniSeciliHucreler.has(`${veri.key}-${sutunKey}`)
    );

    tumData.forEach((veri) => {
      const hucreKey = `${veri.key}-${sutunKey}`;
      tumSecilenler
        ? yeniSeciliHucreler.delete(hucreKey)
        : yeniSeciliHucreler.add(hucreKey);
    });
    stateGuncelle({ secilenHucreler: yeniSeciliHucreler });
  };

  const tabloSutunlari: ColumnType<DataTuru>[] = sutunlar.map((sutun, sutunIndex) => ({
    ...sutun,
    onHeaderCell: () => ({
      onClick: () => sutunBaslikTiklama(sutun.dataIndex as keyof DataTuru),
      style: {
        cursor: "pointer",
      },
    }),
    onCell: (veri: DataTuru, index?: number) => ({
      onMouseDown: () => hucreMouseDown(veri, sutun.dataIndex as keyof DataTuru),
      onMouseOver: () => hucreMouseOver(veri, sutun.dataIndex as keyof DataTuru),
      onMouseUp: hucreMouseUp,
      onClick: () => stateGuncelle({ 
        aktifHucre: { satir: index ?? 0, sutun: sutunIndex },
        baslangicHucresi: { satir: index ?? 0, sutun: sutunIndex }
      }),
      style: {
        backgroundColor: hucreSeciliMi(veri, sutun.dataIndex as keyof DataTuru) ? "lightblue" : "",
        cursor: "pointer",
        outline: "none",
        border: state.aktifHucre.satir === (index ?? 0) && state.aktifHucre.sutun === sutunIndex ? "1px solid #2d9594" : "none",
      },
    }),    
  }));

  const seciliSatirDegisikligi = (_: any, yeniSeciliSatirlar: DataTuru[]) => {
    const guncelSeciliSatirlar = [
      ...state.seciliSatirData.filter(
        (satir) => !kaynakData.some((d) => d.key === satir.key)
      ),
      ...yeniSeciliSatirlar,
    ];
    stateGuncelle({
      seciliSatirAnahtarlari: guncelSeciliSatirlar.map((satir) => satir.key),
      seciliSatirData: guncelSeciliSatirlar,
    });
  };

  const satirSecimi: TableRowSelection<DataTuru> = {
    selectedRowKeys: state.seciliSatirAnahtarlari,
    onChange: seciliSatirDegisikligi,
  };

  return (
    <div ref={tabloRef} tabIndex={0}>
    <Table<DataTuru>
      title={() => <h2>Table Excel</h2>}
      columns={tabloSutunlari}
      rowSelection={satirSecimi}
      dataSource={kaynakData}
      bordered
      loading={state.yukleniyor}
      pagination={{
        pageSize: state.sayfaBoyutu,
        onChange: sayfalandirmaDegisikligi,
        current: state.gecerliSayfa,
        total: tumData.length,
        showSizeChanger: true,
      }}
      style={{ userSelect: "none" }}
    />
  </div>
  );
};

export default TabloExcel;
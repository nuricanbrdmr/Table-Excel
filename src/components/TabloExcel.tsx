import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Table } from "antd";
import type { ColumnType } from "antd/es/table";
import { TableRowSelection } from "antd/es/table/interface";

interface DataTuru {
  key: React.Key;
  isim: string;
  yas: number;
  cinsiyet: string;
  dtarih: string;
  adres: string;
  aktif: boolean;
}

const sutunlar: ColumnType<DataTuru>[] = [
  { title: "İsim", dataIndex: "isim", key: "isim", width: "20%" },
  { title: "Yaş", dataIndex: "yas", key: "yas", width: "10%" },
  { title: "Cinsiyet", dataIndex: "cinsiyet", key: "cinsiyet", width: "15%" },
  { title: "Doğum Tarihi", dataIndex: "dtarih", key: "dtarih", width: "15%" },
  { title: "Adres", dataIndex: "adres", key: "adres", width: "25%" },
  {
    title: "Aktif",
    dataIndex: "aktif",
    key: "aktif",
    width: "10%",
    render: (value: boolean) => value.toString(),
  },
];

const tumData: DataTuru[] = Array.from({ length: 50 }, (_, i) => ({
  key: i,
  isim: `Nuri Can Birdemir ${i + 1}`,
  yas: 11 + i,
  cinsiyet: i% 2 ? "Erkek":"Kadın",
  dtarih: "16.06.2003",
  adres: `Hadımköy, Baykar Özdemir Bayraktar Merkezi . ${i + 1}`,
  aktif: i % 2 ? true : false,
}));

const TabloExcel: React.FC = () => {
  const [state, setState] = useState({
    secilenHucreler: new Set<string>(),
    seciliyorMu: false,
    baslangicHucresi: { satir: 0, sutun: 0 },
    ctrlBasiliMi: false,
    shiftBasiliMi: false,
    seciliSatirAnahtarlari: [] as React.Key[],
    seciliSatirData: [] as DataTuru[],
    aktifHucre: { satir: 0, sutun: 0 },
    data: tumData.slice(0, 10),
    yuklenenVeriSayisi: 10,
    yukleniyor: false,
    tumDataYuklendi: false
  });

  const tabloRef = useRef<HTMLDivElement>(null);

  const stateGuncelle = useCallback((yeniState: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...yeniState }));
  }, []);

  // Scroll ile 10'arlı şekilde data yükleme
  useEffect(() => {
    const tabloContainer = tabloRef.current?.querySelector('.ant-table-body');
    
    const handleScroll = () => {
      if (!tabloContainer || state.yukleniyor || state.tumDataYuklendi) return;

      const { scrollTop, scrollHeight, clientHeight } = tabloContainer;
      const scrollSonu = scrollHeight - scrollTop <= clientHeight + 20;

      if (scrollSonu) {
        setState(prev => ({ ...prev, yukleniyor: true }));
        
        setTimeout(() => {
          const yeniSayi = state.yuklenenVeriSayisi + 10;
          setState(prev => ({
            ...prev,
            data: tumData.slice(0, yeniSayi),
            yuklenenVeriSayisi: yeniSayi,
            yukleniyor: false,
            tumDataYuklendi: yeniSayi >= tumData.length
          }));
        }, 500);
      }
    };

    tabloContainer?.addEventListener('scroll', handleScroll);
    return () => tabloContainer?.removeEventListener('scroll', handleScroll);
  }, [state.yukleniyor, state.tumDataYuklendi, state.yuklenenVeriSayisi]);

  // Key ve Mouse Event kontrolleri
  useEffect(() => {
    const tusDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) stateGuncelle({ ctrlBasiliMi: true });
      if (event.shiftKey) stateGuncelle({ shiftBasiliMi: true });
      if (event.ctrlKey && event.key === "c") kopyala();
      okTusKullanimi(event);
    };
    const tusUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey) stateGuncelle({ ctrlBasiliMi: false });
      if (!event.shiftKey) stateGuncelle({ shiftBasiliMi: false });
    };

    window.addEventListener("keydown", tusDown);
    window.addEventListener("keyup", tusUp);
    return () => {
      window.removeEventListener("keydown", tusDown);
      window.removeEventListener("keyup", tusUp);
    };
  }, [
    state.secilenHucreler,
    state.seciliSatirAnahtarlari,
    state.aktifHucre,
    state.data,
  ]);

  const okTusKullanimi = (event: KeyboardEvent) => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      event.preventDefault();
      const { satir, sutun } = state.aktifHucre;
      let yeniSatir = satir;
      let yeniSutun = sutun;

      switch (event.key) {
        case "ArrowUp":
          yeniSatir = Math.max(0, satir - 1);
          break;
        case "ArrowDown":
          yeniSatir = Math.min(state.data.length - 1, satir + 1);
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

  const seciliHucreleriGuncelle = (
    satir: number,
    sutun: number,
    shiftBasili: boolean
  ) => {
    if (!shiftBasili) {
      const yeniSecilenHucreler = new Set([
        `${state.data[satir].key}-${sutunlar[sutun].dataIndex}`,
      ]);
      stateGuncelle({
        secilenHucreler: yeniSecilenHucreler,
        baslangicHucresi: { satir, sutun },
      });
    } else if (state.baslangicHucresi) {
      aralikSecimiYap(state.baslangicHucresi, { satir, sutun });
    }
  };

  const hucreGoruntule = (satir: number, sutun: number) => {
    if (tabloRef.current) {
      const hucre = tabloRef.current.querySelector(
        `[data-row-key="${state.data[satir].key}"] td:nth-child(${sutun + 2})`
      );
      if (hucre) {
        hucre.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  };

  const hucreMouseDown = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    const satirIndex = state.data.findIndex((item) => item.key === veri.key);
    const sutunIndex = sutunlar.findIndex(
      (sutun) => sutun.dataIndex === sutunKey
    );

    if (!state.ctrlBasiliMi && !state.shiftBasiliMi) {
      stateGuncelle({ secilenHucreler: new Set() });
    }

    stateGuncelle({
      seciliyorMu: true,
      baslangicHucresi: { satir: satirIndex, sutun: sutunIndex },
      aktifHucre: { satir: satirIndex, sutun: sutunIndex },
    });

    if (state.shiftBasiliMi) {
      aralikSecimiYap(state.aktifHucre, {
        satir: satirIndex,
        sutun: sutunIndex,
      });
    } else {
      hucreSeciminidegistir(veri, sutunKey);
    }
  };

  const hucreMouseOver = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (state.seciliyorMu) {
      const bitisSatir = state.data.findIndex((item) => item.key === veri.key);
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
    stateGuncelle({ seciliyorMu: false });
  };

  const hucreSeciminidegistir = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    const hucreKey = `${veri.key}-${sutunKey}`;
    setState((prevState) => {
      const yeniSet = new Set(prevState.secilenHucreler);
      yeniSet.has(hucreKey) ? yeniSet.delete(hucreKey) : yeniSet.add(hucreKey);
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

    const yeniSecimler = new Set<string>();

    for (let satir = minSatir; satir <= maxSatir; satir++) {
      for (let sutun = minSutun; sutun <= maxSutun; sutun++) {
        const veri = state.data[satir];
        const sutunKey = sutunlar[sutun].dataIndex as keyof DataTuru;
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
    const sutunIndexListesi: number[] = [];

    state.data.forEach((veri, satirIndex) => {
      sutunlar.forEach((sutun, sutunIndex) => {
        const sutunKey = sutun.dataIndex as keyof DataTuru;
        const hucreDegeri = veri[sutunKey].toString();
        const hucreKey = `${veri.key}-${sutunKey}`;
        if (
          state.secilenHucreler.has(hucreKey) ||
          state.seciliSatirAnahtarlari.includes(veri.key)
        ) {
          if (!satirSutunGruplari[satirIndex]) {
            satirSutunGruplari[satirIndex] = [];
          }
          satirSutunGruplari[satirIndex][sutunIndex] = hucreDegeri;
          sutunIndexListesi.push(sutunIndex);
        }
      });
    });
    const minKey = Math.min(
      ...Object.values(sutunIndexListesi).map((key) => key)
    );

    let tabloMetni = "";
    if (minKey === 0) {
      tabloMetni = Object.values(satirSutunGruplari)
        .map((satir) => satir.join("\t"))
        .join("\n");
    } else {
      tabloMetni = Object.values(satirSutunGruplari)
        .map((satir) => {
          const satirKeys = Object.keys(satir).map(Number);

          return satirKeys
            .map((key) => {
              const adjustedKey = key - minKey;
              const cell = satir[key];
              const spaces = "\t".repeat(adjustedKey);
              return spaces + cell;
            })
            .join("");
        })
        .join("\n");
    }

    navigator.clipboard
      .writeText(tabloMetni)
      .then(() => {
        stateGuncelle({ ctrlBasiliMi: false }); 
        alert("Veriler kopyalandı!")
      });
  };

  const tabloSutunlari: ColumnType<DataTuru>[] = sutunlar.map(
    (sutun, sutunIndex) => ({
      ...sutun,
      onCell: (veri: DataTuru, index?: number) => ({
        onMouseDown: () =>
          hucreMouseDown(veri, sutun.dataIndex as keyof DataTuru),
        onMouseOver: () =>
          hucreMouseOver(veri, sutun.dataIndex as keyof DataTuru),
        onMouseUp: hucreMouseUp,
        style: {
          backgroundColor: hucreSeciliMi(
            veri,
            sutun.dataIndex as keyof DataTuru
          )
            ? "lightblue"
            : undefined,
          cursor: "pointer",
          outline: "none",
          border:
            state.aktifHucre.satir === index &&
            state.aktifHucre.sutun === sutunIndex
              ? "1px solid #2d9594"
              : undefined,
        },
      }),
    })
  );

  const seciliSatirDegisikligi = (_: any, yeniSeciliSatirlar: DataTuru[]) => {
    const guncelSeciliSatirlar = [
      ...state.seciliSatirData.filter(
        (satir) => !state.data.some((d) => d.key === satir.key)
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
        columns={tabloSutunlari}
        rowSelection={satirSecimi}
        dataSource={state.data}
        bordered
        loading={state.yukleniyor}
        pagination={false} 
        scroll={{ y: 500 }} 
        style={{ userSelect: "none" }}
      />
    </div>
  );
};

export default TabloExcel;
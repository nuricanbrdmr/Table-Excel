import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Input, Table } from "antd";
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
    secilenHucreler: new Set<string>(),
    gecerliSayfa: 1,
    sayfaBoyutu: 10,
    seciliyorMu: false,
    baslangicHucresi: null as { satir: number; sutun: number } | null,
    shiftBasiliMi: false,
    yukleniyor: false,
    seciliSatirAnahtarlari: [] as React.Key[],
    seciliSatirData: [] as DataTuru[],
    aktifHucre: { satir: 0, sutun: 0 },
    duzenleModu: false,
    duzenleDegeri: '',
    data: tumData,
    gecmis: [] as { data: DataTuru[], secilenHucreler: Set<string> }[],
    gecmisIndex: -1,
  });

  const tabloRef = useRef<HTMLDivElement>(null);

  const stateGuncelle = useCallback((yeniState: Partial<typeof state>) => {
    setState((prevState) => {
      const yeniTamState = { ...prevState, ...yeniState };
      
      if (yeniState.data || yeniState.secilenHucreler) {
        const yeniGecmis = [
          ...prevState.gecmis.slice(0, prevState.gecmisIndex + 1),
          {
            data: yeniTamState.data,
            secilenHucreler: new Set(yeniTamState.secilenHucreler),
          },
        ];
        return {
          ...yeniTamState,
          gecmis: yeniGecmis,
          gecmisIndex: yeniGecmis.length - 1,
        };
      }
      
      return yeniTamState;
    });
  }, []);

  const kaynakData = useMemo(() => {
    const baslangicIndex = (state.gecerliSayfa - 1) * state.sayfaBoyutu;
    return state.data.slice(
      baslangicIndex,
      baslangicIndex + state.sayfaBoyutu
    );
  }, [state.gecerliSayfa, state.sayfaBoyutu, state.data]);

  useEffect(() => {
    const tusDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: true });
      if (event.ctrlKey && event.key === "c") kopyala();
      if (event.ctrlKey && event.key === "v") yapistir();
      if (event.ctrlKey && event.key === "z") geriAl();
      okTusKullanimi(event);
    };
    const tusUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") stateGuncelle({ shiftBasiliMi: false });
    };

    window.addEventListener("keydown", tusDown);
    window.addEventListener("keyup", tusUp);
    return () => {
      window.removeEventListener("keydown", tusDown);
      window.removeEventListener("keyup", tusUp);
    };
  }, [state.secilenHucreler, state.seciliSatirAnahtarlari, state.aktifHucre, state.data]);

  const okTusKullanimi = (event: KeyboardEvent) => {
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

  const seciliSutunSayisi = (): number => {
    const seciliSutunlar = new Set<string>();
    state.secilenHucreler.forEach((hucreKey) => {
      const [_, sutunKey] = hucreKey.split('-');
      seciliSutunlar.add(sutunKey);
    });
    return seciliSutunlar.size;
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
          data: state.data,
          secilenHucreler: Array.from(state.secilenHucreler),
          seciliSatirlar: state.seciliSatirData,
          gecerliSayfa: state.gecerliSayfa,
          sayfaBoyutu: state.sayfaBoyutu,
        })
      );
    }
  }, [
    state.data,
    state.secilenHucreler,
    state.seciliSatirData,
    state.gecerliSayfa,
    state.sayfaBoyutu,
  ]);

  useEffect(() => {
    const kayitliVeriler = localStorage.getItem("tabloVerileri");
    if (kayitliVeriler) {
      const {
        data,
        secilenHucreler,
        seciliSatirlar,
        gecerliSayfa: kayitliSayfa,
        sayfaBoyutu: kayitliBoyut,
      } = JSON.parse(kayitliVeriler);
      stateGuncelle({
        data: data.sort(() => Math.random() - 0.5),
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
        satir: state.data.findIndex((item) => item.key === veri.key),
        sutun: sutunlar.findIndex((sutun) => sutun.dataIndex === sutunKey),
      },
      aktifHucre: {
        satir: state.data.findIndex((item) => item.key === veri.key),
        sutun: sutunlar.findIndex((sutun) => sutun.dataIndex === sutunKey)
      }
    });

    hucreSeciminidegistir(veri, sutunKey);
  };

  const hucreMouseOver = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    if (state.seciliyorMu && state.baslangicHucresi) {
      const bitisSatir = state.data.findIndex(
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
        const veri = state.data[satir];
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
    state.data.forEach((veri, satirIndex) => {
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
      navigator.clipboard
      .writeText(tabloMetni)
      .then(() => alert("Veriler kopyalandı!"));
  };

  const yapistir = () => {
    navigator.clipboard.readText().then((clipText) => {
      const satirlar = clipText.split('\n').filter(line => line.trim() !== "");
      let yeniData = [...state.data];
      let guncelSatir = state.aktifHucre.satir;
      let guncelSutun = state.aktifHucre.sutun;

      const sutunSayisi = seciliSutunSayisi();
      satirlar.forEach((satir) => {
        const hucreler = satir.split('\t').slice(0, sutunSayisi);
        hucreler.forEach((hucre, index) => {
          if (guncelSatir < yeniData.length && guncelSutun + index < sutunlar.length) {
            const sutunKey = sutunlar[guncelSutun + index].dataIndex as keyof DataTuru;
            yeniData[guncelSatir] = {
              ...yeniData[guncelSatir],
              [sutunKey]: hucre
            };
          }
        });
        guncelSatir++;
      });
  
      stateGuncelle({ data: yeniData });
    });
  };

  const geriAl = useCallback(() => {
    if (state.gecmisIndex > 0) {
      const oncekiDurum = state.gecmis[state.gecmisIndex - 1];
      stateGuncelle({
        data: oncekiDurum.data,
        secilenHucreler: oncekiDurum.secilenHucreler,
        gecmisIndex: state.gecmisIndex - 1,
      });
    }
  }, [state.gecmisIndex, state.gecmis]);

  const sutunBaslikTiklama = (sutunKey: keyof DataTuru) => {
    const yeniSeciliHucreler = new Set(state.secilenHucreler);
    const tumSecilenler = state.data.every((veri) =>
      yeniSeciliHucreler.has(`${veri.key}-${sutunKey}`)
    );

    state.data.forEach((veri) => {
      const hucreKey = `${veri.key}-${sutunKey}`;
      tumSecilenler
        ? yeniSeciliHucreler.delete(hucreKey)
        : yeniSeciliHucreler.add(hucreKey);
    });
    stateGuncelle({ secilenHucreler: yeniSeciliHucreler });
  };

  const hucreDuzenleModunaGec = (veri: DataTuru, sutunKey: keyof DataTuru) => {
    stateGuncelle({
      duzenleModu: true,
      duzenleDegeri: veri[sutunKey].toString(),
      aktifHucre: {
        satir: state.data.findIndex((item) => item.key === veri.key),
        sutun: sutunlar.findIndex((sutun) => sutun.dataIndex === sutunKey),
      },
    });
  };

  const hucreDuzenleKaydet = () => {
    const { satir, sutun } = state.aktifHucre;
    const sutunKey = sutunlar[sutun].dataIndex as keyof DataTuru;
    const yeniData = [...state.data];
    yeniData[satir] = {
      ...yeniData[satir],
      [sutunKey]: state.duzenleDegeri,
    };
    stateGuncelle({
      data: yeniData,
      duzenleModu: false,
      duzenleDegeri: '',
    });
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
      onDoubleClick: () => hucreDuzenleModunaGec(veri, sutun.dataIndex as keyof DataTuru),
      style: {
        backgroundColor: hucreSeciliMi(veri, sutun.dataIndex as keyof DataTuru) ? "lightblue" : undefined,
        cursor: "pointer",
        outline: "none",
        border: state.aktifHucre.satir === index && state.aktifHucre.sutun === sutunIndex ? "1px solid #2d9594" : undefined,
      },
    }),
    render: (metin: string, veri: DataTuru) => {
      const duzenlendiMi = state.duzenleModu && 
                        state.aktifHucre.satir === state.data.findIndex((item) => item.key === veri.key) &&
                        state.aktifHucre.sutun === sutunIndex;
      return duzenlendiMi ? (
        <Input
          value={state.duzenleDegeri}
          onChange={(e) => stateGuncelle({ duzenleDegeri: e.target.value })}
          onPressEnter={hucreDuzenleKaydet}
          onBlur={hucreDuzenleKaydet}
          autoFocus
        />
      ) : (
        metin
      );
    },
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
        total: state.data.length,
        showSizeChanger: true,
      }}
      style={{ userSelect: "none" }}
    />
  </div>
  );
};

export default TabloExcel;
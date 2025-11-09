import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Flame } from "lucide-react";

interface GrainPerformance {
  burningArea: number;
  burnRate: number;
  massFlowRate: number;
  chamberPressure: number;
  thrust: number;
  burnTime: number;
  webThickness: number;
}

type GrainGeometry = "bates" | "cylindrical" | "star" | "finocyl";

export default function GrainDesign() {
  const [geometry, setGeometry] = useState<GrainGeometry>("bates");
  const [outerDiameter, setOuterDiameter] = useState<string>("76.2");
  const [coreDiameter, setCoreDiameter] = useState<string>("25.4");
  const [grainLength, setGrainLength] = useState<string>("100");
  const [numSegments, setNumSegments] = useState<string>("4");
  const [propellantDensity, setPropellantDensity] = useState<string>("1800");
  const [burnRateCoeff, setBurnRateCoeff] = useState<string>("8.26");
  const [pressureExponent, setPressureExponent] = useState<string>("0.319");
  const [throatDiameter, setThroatDiameter] = useState<string>("12.7");
  const [results, setResults] = useState<GrainPerformance | null>(null);

  const calculateGrainPerformance = () => {
    const D_outer = parseFloat(outerDiameter) / 1000; // mm to m
    const D_core = parseFloat(coreDiameter) / 1000;
    const L = parseFloat(grainLength) / 1000;
    const n_seg = parseInt(numSegments);
    const rho = parseFloat(propellantDensity);
    const a = parseFloat(burnRateCoeff) / 1000; // mm/s/MPa^n to m/s/MPa^n
    const n = parseFloat(pressureExponent);
    const D_throat = parseFloat(throatDiameter) / 1000;

    // Calcular área de queima inicial baseada na geometria
    let Ab = 0;
    const R_outer = D_outer / 2;
    const R_core = D_core / 2;

    switch (geometry) {
      case "bates":
        // BATES: núcleo + extremidades dos segmentos
        const core_area = 2 * Math.PI * R_core * L * n_seg;
        const end_area = Math.PI * (R_outer ** 2 - R_core ** 2) * 2 * n_seg;
        Ab = core_area + end_area;
        break;
      case "cylindrical":
        // Cilíndrico oco: todas as superfícies queimam
        const inner = 2 * Math.PI * R_core * L;
        const outer = 2 * Math.PI * R_outer * L;
        const ends = 2 * Math.PI * (R_outer ** 2 - R_core ** 2);
        Ab = inner + outer + ends;
        break;
      case "star":
        // Estrela: aproximação com fator de multiplicação
        const star_factor = 2.5; // estrela de 5 pontas
        Ab = 2 * Math.PI * R_core * L * star_factor;
        break;
      case "finocyl":
        // Finocyl: núcleo + fins
        const num_fins = 6;
        const fin_depth = (R_outer - R_core) * 0.7;
        const fin_width = 0.005; // 5mm
        const core_finocyl = 2 * Math.PI * R_core * L;
        const fins_area = num_fins * 2 * fin_depth * L;
        Ab = core_finocyl + fins_area;
        break;
    }

    // Área da garganta
    const A_throat = Math.PI * (D_throat / 2) ** 2;

    // Constantes do propelente (KNSB típico)
    const k = 1.133; // razão de calores específicos
    const T_chamber = 1600; // K
    const M_molar = 0.042; // kg/mol
    const R = 8314; // J/(kmol·K)
    const R_gas = R / M_molar;

    // Iteração para encontrar pressão de câmara
    // P_chamber tal que: rho * Ab * r(P) = A_throat * rho_throat * v_throat
    let P_chamber = 5e6; // chute inicial: 5 MPa
    for (let i = 0; i < 20; i++) {
      const r = a * (P_chamber / 1e6) ** n; // burn rate em m/s
      const mass_flow = rho * Ab * r;
      
      // Vazão mássica pela garganta (choked flow)
      const throat_flow = A_throat * P_chamber * Math.sqrt(k / (R_gas * T_chamber)) * 
                          Math.pow(2 / (k + 1), (k + 1) / (2 * (k - 1)));
      
      // Ajustar pressão
      const error = mass_flow - throat_flow;
      P_chamber += error * 1e5; // ajuste proporcional
      
      if (Math.abs(error / mass_flow) < 0.01) break;
    }

    // Recalcular com pressão final
    const r_final = a * (P_chamber / 1e6) ** n;
    const mass_flow_final = rho * Ab * r_final;

    // Coeficiente de empuxo (típico)
    const Cf = 1.5;
    const thrust = Cf * A_throat * P_chamber;

    // Espessura da parede (web thickness)
    const web = (D_outer - D_core) / 2;

    // Tempo de queima
    const burn_time = web / r_final;

    setResults({
      burningArea: Ab * 1e4, // m² to cm²
      burnRate: r_final * 1000, // m/s to mm/s
      massFlowRate: mass_flow_final * 1000, // kg/s to g/s
      chamberPressure: P_chamber / 1e6, // Pa to MPa
      thrust: thrust,
      burnTime: burn_time,
      webThickness: web * 1000, // m to mm
    });
  };

  const getGeometryDescription = (geom: GrainGeometry): string => {
    switch (geom) {
      case "bates":
        return "Múltiplos segmentos cilíndricos com núcleo central. Queima neutra a progressiva.";
      case "cylindrical":
        return "Cilindro oco simples. Queima em todas as superfícies.";
      case "star":
        return "Núcleo em forma de estrela. Queima progressiva com alto empuxo inicial.";
      case "finocyl":
        return "Núcleo cilíndrico com fins radiais. Queima progressiva controlada.";
    }
  };

  return (
    <div className="container py-12 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-accent rounded-xl">
              <Flame className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Dimensionamento e Performance dos Grãos
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Configure a geometria do grão propelente e calcule a performance esperada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Parâmetros do Grão</CardTitle>
              <CardDescription className="text-base">Configure as dimensões e propriedades do propelente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Geometria */}
              <div className="space-y-2">
                <Label htmlFor="geometry">Geometria do Grão</Label>
                <Select value={geometry} onValueChange={(v) => setGeometry(v as GrainGeometry)}>
                  <SelectTrigger id="geometry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bates">BATES (Multi-segmento)</SelectItem>
                    <SelectItem value="cylindrical">Cilíndrico Oco</SelectItem>
                    <SelectItem value="star">Estrela</SelectItem>
                    <SelectItem value="finocyl">Finocyl</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{getGeometryDescription(geometry)}</p>
              </div>

              {/* Dimensões */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outer-diameter">Diâmetro Externo (mm)</Label>
                  <Input
                    id="outer-diameter"
                    type="number"
                    step="0.1"
                    value={outerDiameter}
                    onChange={(e) => setOuterDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="core-diameter">Diâmetro do Núcleo (mm)</Label>
                  <Input
                    id="core-diameter"
                    type="number"
                    step="0.1"
                    value={coreDiameter}
                    onChange={(e) => setCoreDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grain-length">Comprimento (mm)</Label>
                  <Input
                    id="grain-length"
                    type="number"
                    step="0.1"
                    value={grainLength}
                    onChange={(e) => setGrainLength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-segments">Número de Segmentos</Label>
                  <Input
                    id="num-segments"
                    type="number"
                    min="1"
                    value={numSegments}
                    onChange={(e) => setNumSegments(e.target.value)}
                  />
                </div>
              </div>

              {/* Propriedades do Propelente */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Propriedades do Propelente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="density">Densidade (kg/m³)</Label>
                    <Input
                      id="density"
                      type="number"
                      value={propellantDensity}
                      onChange={(e) => setPropellantDensity(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">KNSB: ~1800</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burn-coeff">Coef. de Queima (mm/s/MPa^n)</Label>
                    <Input
                      id="burn-coeff"
                      type="number"
                      step="0.01"
                      value={burnRateCoeff}
                      onChange={(e) => setBurnRateCoeff(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">KNSB: ~8.26</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pressure-exp">Expoente de Pressão (n)</Label>
                    <Input
                      id="pressure-exp"
                      type="number"
                      step="0.001"
                      value={pressureExponent}
                      onChange={(e) => setPressureExponent(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">KNSB: ~0.319</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="throat">Diâmetro da Garganta (mm)</Label>
                    <Input
                      id="throat"
                      type="number"
                      step="0.1"
                      value={throatDiameter}
                      onChange={(e) => setThroatDiameter(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={calculateGrainPerformance} className="w-full h-12 text-base" size="lg">
                <Rocket className="w-5 h-5 mr-2" />
                Calcular Performance
              </Button>
            </CardContent>
          </Card>

          {/* Resultados */}
          <div className="space-y-6">
            {results && (
              <>
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Performance Calculada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Área de Queima</p>
                        <p className="text-xl font-bold">{results.burningArea.toFixed(2)} cm²</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Taxa de Queima</p>
                        <p className="text-xl font-bold">{results.burnRate.toFixed(3)} mm/s</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Vazão Mássica</p>
                        <p className="text-xl font-bold">{results.massFlowRate.toFixed(2)} g/s</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Pressão da Câmara</p>
                        <p className="text-xl font-bold">{results.chamberPressure.toFixed(2)} MPa</p>
                      </div>
                      <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                        <p className="text-xs text-muted-foreground">Empuxo</p>
                        <p className="text-xl font-bold text-accent">{results.thrust.toFixed(2)} N</p>
                      </div>
                      <div className="p-3 bg-accent/20 rounded-lg border border-accent">
                        <p className="text-xs text-muted-foreground">Tempo de Queima</p>
                        <p className="text-xl font-bold text-accent">{results.burnTime.toFixed(2)} s</p>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary">
                      <p className="text-xs text-muted-foreground">Espessura da Parede (Web)</p>
                      <p className="text-2xl font-bold text-primary">{results.webThickness.toFixed(2)} mm</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Características da Queima</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 border-b">
                        <span className="text-sm font-medium">Tipo de Queima:</span>
                        <span className="text-sm">
                          {geometry === "bates" ? "Neutra a Progressiva" : 
                           geometry === "cylindrical" ? "Regressiva" :
                           "Progressiva"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b">
                        <span className="text-sm font-medium">Impulso Total Estimado:</span>
                        <span className="text-sm font-bold">
                          {(results.thrust * results.burnTime).toFixed(2)} N·s
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 border-b">
                        <span className="text-sm font-medium">Classificação:</span>
                        <span className="text-sm">
                          {results.thrust * results.burnTime < 160 ? "H" :
                           results.thrust * results.burnTime < 320 ? "I" :
                           results.thrust * results.burnTime < 640 ? "J" :
                           results.thrust * results.burnTime < 1280 ? "K" : "L+"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2">
                        <span className="text-sm font-medium">Kn (Razão de Queima):</span>
                        <span className="text-sm">
                          {((results.burningArea / 1e4) / (Math.PI * (parseFloat(throatDiameter) / 2000) ** 2)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!results && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Configure os parâmetros e clique em Calcular Performance</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

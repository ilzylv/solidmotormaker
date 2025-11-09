import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Cog, AlertTriangle, CheckCircle2 } from "lucide-react";

interface StructuralResults {
  // Case
  internalDiameter: number;
  tangentialStress: number;
  radialStress: number;
  longitudinalStress: number;
  vonMisesStress: number;
  safetyFactor: number;
  caseStatus: "safe" | "acceptable" | "unsafe";
  
  // Bulkhead
  bulkheadThickness: number;
  
  // Screws
  numScrews: number;
  screwForce: number;
  screwShearStress: number;
  screwSafetyFactor: number;
  
  // Nozzle
  throatArea: number;
  exitArea: number;
  expansionRatio: number;
  exitDiameter: number;
}

export default function Structural() {
  // Case inputs
  const [caseThickness, setCaseThickness] = useState<string>("3.175");
  const [caseOuterDiameter, setCaseOuterDiameter] = useState<string>("76.2");
  const [maxPressure, setMaxPressure] = useState<string>("7");
  const [caseYieldStrength, setCaseYieldStrength] = useState<string>("150");
  const [targetSafetyFactor, setTargetSafetyFactor] = useState<string>("2");
  
  // Bulkhead inputs
  const [bulkheadYieldStrength, setBulkheadYieldStrength] = useState<string>("205");
  const [radialThickness, setRadialThickness] = useState<string>("7");
  
  // Screw inputs
  const [screwDiameter, setScrewDiameter] = useState<string>("9.03");
  const [holeDiameter, setHoleDiameter] = useState<string>("10");
  const [screwShearStrength, setScrewShearStrength] = useState<string>("207");
  
  // Nozzle inputs
  const [throatDiameter, setThroatDiameter] = useState<string>("12.7");
  const [desiredExpansion, setDesiredExpansion] = useState<string>("6");
  
  const [results, setResults] = useState<StructuralResults | null>(null);

  const calculate = () => {
    // Converter para unidades SI
    const e = parseFloat(caseThickness) / 1000; // mm to m
    const D_ext = parseFloat(caseOuterDiameter) / 1000;
    const P = parseFloat(maxPressure) * 1e6; // MPa to Pa
    const sigma_y_case = parseFloat(caseYieldStrength) * 1e6;
    const FS_target = parseFloat(targetSafetyFactor);
    const sigma_y_bulkhead = parseFloat(bulkheadYieldStrength) * 1e6;
    const e_r = parseFloat(radialThickness) / 1000;
    const d_screw = parseFloat(screwDiameter) / 1000;
    const d_hole = parseFloat(holeDiameter) / 1000;
    const tau_screw = parseFloat(screwShearStrength) * 1e6;
    const D_throat = parseFloat(throatDiameter) / 1000;
    const epsilon = parseFloat(desiredExpansion);

    // Cálculos do Case
    const D_int = D_ext - 2 * e;
    const r_int = D_int / 2;
    const r_ext = D_ext / 2;

    // Tensões (fórmulas de Lamé para cilindro de parede espessa)
    const sigma_t = P * (r_int ** 2 + r_ext ** 2) / (r_ext ** 2 - r_int ** 2); // tangencial
    const sigma_r = -P; // radial (na parede interna)
    const sigma_l = P * r_int ** 2 / (r_ext ** 2 - r_int ** 2); // longitudinal

    // Tensão de Von Mises
    const sigma_vm = Math.sqrt(
      0.5 * ((sigma_t - sigma_r) ** 2 + (sigma_r - sigma_l) ** 2 + (sigma_l - sigma_t) ** 2)
    );

    // Fator de segurança
    const FS_case = sigma_y_case / sigma_vm;
    
    let status: "safe" | "acceptable" | "unsafe";
    if (FS_case >= FS_target) status = "safe";
    else if (FS_case >= FS_target * 0.8) status = "acceptable";
    else status = "unsafe";

    // Bulkhead
    // Espessura necessária (placa circular engastada)
    const e_bulkhead = (r_int / 2) * Math.sqrt((3 * P * FS_target) / sigma_y_bulkhead);

    // Parafusos
    // Força total = Pressão × Área
    const F_total = P * Math.PI * r_int ** 2;
    
    // Número de parafusos (baseado no perímetro e espaçamento típico)
    const perimeter = Math.PI * D_int;
    const spacing = 0.025; // 25mm típico
    const n_screws = Math.ceil(perimeter / spacing);
    
    // Força por parafuso
    const F_screw = F_total / n_screws;
    
    // Área de cisalhamento do parafuso
    const A_screw = Math.PI * (d_screw / 2) ** 2;
    
    // Tensão de cisalhamento
    const tau = F_screw / A_screw;
    
    // Fator de segurança do parafuso
    const FS_screw = tau_screw / tau;

    // Tubeira (Nozzle)
    const A_throat = Math.PI * (D_throat / 2) ** 2;
    const A_exit = A_throat * epsilon;
    const D_exit = Math.sqrt((4 * A_exit) / Math.PI);

    setResults({
      internalDiameter: D_int * 1000,
      tangentialStress: sigma_t / 1e6,
      radialStress: sigma_r / 1e6,
      longitudinalStress: sigma_l / 1e6,
      vonMisesStress: sigma_vm / 1e6,
      safetyFactor: FS_case,
      caseStatus: status,
      bulkheadThickness: e_bulkhead * 1000,
      numScrews: n_screws,
      screwForce: F_screw,
      screwShearStress: tau / 1e6,
      screwSafetyFactor: FS_screw,
      throatArea: A_throat * 1e6,
      exitArea: A_exit * 1e6,
      expansionRatio: epsilon,
      exitDiameter: D_exit * 1000,
    });
  };

  return (
    <div className="container py-12 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-primary rounded-xl">
              <Cog className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Dimensionamento Estrutural e Visualização
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calcule dimensões de componentes estruturais e visualize o layout do motor
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs Column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Case */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Case (Invólucro)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="case-thickness">Espessura (mm)</Label>
                  <Input
                    id="case-thickness"
                    type="number"
                    step="0.001"
                    value={caseThickness}
                    onChange={(e) => setCaseThickness(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-diameter">Diâmetro Externo (mm)</Label>
                  <Input
                    id="case-diameter"
                    type="number"
                    step="0.1"
                    value={caseOuterDiameter}
                    onChange={(e) => setCaseOuterDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-pressure">Pressão Máxima (MPa)</Label>
                  <Input
                    id="max-pressure"
                    type="number"
                    step="0.1"
                    value={maxPressure}
                    onChange={(e) => setMaxPressure(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case-yield">Tensão de Escoamento (MPa)</Label>
                  <Input
                    id="case-yield"
                    type="number"
                    step="0.1"
                    value={caseYieldStrength}
                    onChange={(e) => setCaseYieldStrength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="safety-factor">Fator de Segurança</Label>
                  <Input
                    id="safety-factor"
                    type="number"
                    step="0.1"
                    value={targetSafetyFactor}
                    onChange={(e) => setTargetSafetyFactor(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bulkhead */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Bulkhead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkhead-yield">Tensão de Escoamento (MPa)</Label>
                  <Input
                    id="bulkhead-yield"
                    type="number"
                    step="0.1"
                    value={bulkheadYieldStrength}
                    onChange={(e) => setBulkheadYieldStrength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="radial-thickness">Espessura Radial (mm)</Label>
                  <Input
                    id="radial-thickness"
                    type="number"
                    step="0.1"
                    value={radialThickness}
                    onChange={(e) => setRadialThickness(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Screws */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Parafusos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="screw-diameter">Diâmetro (mm)</Label>
                  <Input
                    id="screw-diameter"
                    type="number"
                    step="0.01"
                    value={screwDiameter}
                    onChange={(e) => setScrewDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hole-diameter">Diâmetro do Furo (mm)</Label>
                  <Input
                    id="hole-diameter"
                    type="number"
                    step="0.1"
                    value={holeDiameter}
                    onChange={(e) => setHoleDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screw-shear">Tensão de Cisalhamento (MPa)</Label>
                  <Input
                    id="screw-shear"
                    type="number"
                    step="0.1"
                    value={screwShearStrength}
                    onChange={(e) => setScrewShearStrength(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Nozzle */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Tubeira</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="throat-diameter">Diâmetro da Garganta (mm)</Label>
                  <Input
                    id="throat-diameter"
                    type="number"
                    step="0.1"
                    value={throatDiameter}
                    onChange={(e) => setThroatDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expansion-ratio">Razão de Expansão</Label>
                  <Input
                    id="expansion-ratio"
                    type="number"
                    step="0.1"
                    value={desiredExpansion}
                    onChange={(e) => setDesiredExpansion(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={calculate} className="w-full h-12 text-base" size="lg">
              <Cog className="w-5 h-5 mr-2" />
              Calcular Dimensões
            </Button>
          </div>

          {/* Results and Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {results && (
              <>
                {/* Status Alert */}
                <Alert variant={results.caseStatus === "safe" ? "default" : results.caseStatus === "acceptable" ? "default" : "destructive"}>
                  {results.caseStatus === "safe" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {results.caseStatus === "safe" ? "Estrutura Segura" :
                     results.caseStatus === "acceptable" ? "Estrutura Aceitável" :
                     "ATENÇÃO: Estrutura Insegura"}
                  </AlertTitle>
                  <AlertDescription>
                    Fator de segurança do case: {results.safetyFactor.toFixed(2)}
                    {results.caseStatus === "unsafe" && " - Aumente a espessura ou reduza a pressão!"}
                  </AlertDescription>
                </Alert>

                {/* Visualization */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Layout do Motor</CardTitle>
                    <CardDescription>Visualização 2D em escala com componentes estruturais</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 rounded-xl border-2">
                      <svg viewBox="0 0 1000 500" className="w-full h-auto">
                        {/* Background grid */}
                        <defs>
                          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.2"/>
                          </pattern>
                          <linearGradient id="caseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4"/>
                          </linearGradient>
                          <linearGradient id="propGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.3"/>
                            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.5"/>
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.3"/>
                          </linearGradient>
                          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                            <polygon points="0 0, 8 4, 0 8" fill="hsl(var(--primary))" />
                          </marker>
                        </defs>
                        
                        <rect width="1000" height="500" fill="url(#grid)" />
                        
                        {/* Centerline */}
                        <line x1="50" y1="250" x2="950" y2="250" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="10,5" opacity="0.5" />
                        
                        {/* Bulkhead (esquerda) */}
                        <g>
                          <rect
                            x="100"
                            y={250 - parseFloat(caseOuterDiameter) * 0.6}
                            width={Math.max(results.bulkheadThickness * 3, 20)}
                            height={parseFloat(caseOuterDiameter) * 1.2}
                            fill="url(#caseGrad)"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="2.5"
                            rx="3"
                          />
                          <text x={100 + Math.max(results.bulkheadThickness * 1.5, 10)} y="230" fill="hsl(var(--foreground))" fontSize="14" fontWeight="600" textAnchor="middle">
                            Bulkhead
                          </text>
                          <text x={100 + Math.max(results.bulkheadThickness * 1.5, 10)} y="470" fill="hsl(var(--muted-foreground))" fontSize="11" textAnchor="middle">
                            {results.bulkheadThickness.toFixed(1)}mm
                          </text>
                        </g>
                        
                        {/* Case (paredes superior e inferior) */}
                        <g>
                          {/* Parede superior */}
                          <rect
                            x={100 + Math.max(results.bulkheadThickness * 3, 20)}
                            y={250 - parseFloat(caseOuterDiameter) * 0.6}
                            width="500"
                            height={parseFloat(caseThickness) * 1.5}
                            fill="url(#caseGrad)"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="2.5"
                          />
                          {/* Parede inferior */}
                          <rect
                            x={100 + Math.max(results.bulkheadThickness * 3, 20)}
                            y={250 + parseFloat(caseOuterDiameter) * 0.6 - parseFloat(caseThickness) * 1.5}
                            width="500"
                            height={parseFloat(caseThickness) * 1.5}
                            fill="url(#caseGrad)"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="2.5"
                          />
                          <text x="350" y="220" fill="hsl(var(--foreground))" fontSize="16" fontWeight="bold" textAnchor="middle">
                            CASE
                          </text>
                        </g>
                        
                        {/* Propellant grain (interior) */}
                        <g>
                          <rect
                            x={120 + Math.max(results.bulkheadThickness * 3, 20)}
                            y={250 - results.internalDiameter * 0.6}
                            width="460"
                            height={results.internalDiameter * 1.2}
                            fill="url(#propGrad)"
                            stroke="hsl(var(--accent))"
                            strokeWidth="2"
                            strokeDasharray="8,4"
                            rx="4"
                          />
                          <text x="350" y="255" fill="hsl(var(--accent))" fontSize="13" fontWeight="600" textAnchor="middle" opacity="0.8">
                            Grão Propelente
                          </text>
                        </g>
                        
                        {/* Nozzle (tubeira) */}
                        <g>
                          {/* Convergente */}
                          <path
                            d={`M ${600 + Math.max(results.bulkheadThickness * 3, 20)} ${250 - parseFloat(caseOuterDiameter) * 0.6}
                                L ${680} ${250 - parseFloat(throatDiameter) * 0.8}
                                L ${680} ${250 + parseFloat(throatDiameter) * 0.8}
                                L ${600 + Math.max(results.bulkheadThickness * 3, 20)} ${250 + parseFloat(caseOuterDiameter) * 0.6}
                                Z`}
                            fill="hsl(var(--chart-3))"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="2.5"
                          />
                          {/* Divergente */}
                          <path
                            d={`M 680 ${250 - parseFloat(throatDiameter) * 0.8}
                                L ${780} ${250 - results.exitDiameter * 0.6}
                                L ${780} ${250 + results.exitDiameter * 0.6}
                                L 680 ${250 + parseFloat(throatDiameter) * 0.8}
                                Z`}
                            fill="hsl(var(--chart-3))"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="2.5"
                          />
                          {/* Garganta */}
                          <ellipse
                            cx="680"
                            cy="250"
                            rx="3"
                            ry={parseFloat(throatDiameter) * 0.8}
                            fill="hsl(var(--destructive))"
                            stroke="hsl(var(--destructive))"
                            strokeWidth="2"
                          />
                          <text x="730" y="230" fill="hsl(var(--foreground))" fontSize="14" fontWeight="600" textAnchor="middle">
                            Nozzle
                          </text>
                          <text x="680" y="290" fill="hsl(var(--destructive))" fontSize="10" fontWeight="600" textAnchor="middle">
                            Throat Ø{parseFloat(throatDiameter).toFixed(1)}
                          </text>
                        </g>
                        
                        {/* Flame */}
                        <g opacity="0.6">
                          <ellipse cx="820" cy="250" rx="40" ry="30" fill="hsl(var(--chart-1))" opacity="0.3" />
                          <ellipse cx="850" cy="250" rx="50" ry="40" fill="hsl(var(--chart-1))" opacity="0.2" />
                          <ellipse cx="880" cy="250" rx="35" ry="25" fill="hsl(var(--chart-1))" opacity="0.15" />
                        </g>
                        
                        {/* Dimension lines */}
                        {/* Diâmetro externo */}
                        <g>
                          <line x1="70" y1={250 - parseFloat(caseOuterDiameter) * 0.6} x2="70" y2={250 + parseFloat(caseOuterDiameter) * 0.6} stroke="hsl(var(--primary))" strokeWidth="2" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                          <text x="50" y="250" fill="hsl(var(--primary))" fontSize="13" fontWeight="bold" textAnchor="middle" transform={`rotate(-90, 50, 250)`}>
                            Ø{parseFloat(caseOuterDiameter).toFixed(1)}mm
                          </text>
                        </g>
                        
                        {/* Comprimento total */}
                        <g>
                          <line x1="100" y1="480" x2="780" y2="480" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" markerEnd="url(#arrow)" markerStart="url(#arrow)" />
                          <text x="440" y="495" fill="hsl(var(--muted-foreground))" fontSize="12" fontWeight="600" textAnchor="middle">
                            Comprimento Total
                          </text>
                        </g>
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Case Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resultados do Case</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Diâmetro Interno:</span>
                        <span className="font-mono">{results.internalDiameter.toFixed(2)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tensão Tangencial:</span>
                        <span className="font-mono">{results.tangentialStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tensão Radial:</span>
                        <span className="font-mono">{results.radialStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tensão Longitudinal:</span>
                        <span className="font-mono">{results.longitudinalStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Von Mises:</span>
                        <span className="font-mono font-semibold">{results.vonMisesStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Fator de Segurança:</span>
                        <span className={`font-mono font-semibold ${results.caseStatus === "safe" ? "text-green-600" : results.caseStatus === "acceptable" ? "text-yellow-600" : "text-red-600"}`}>
                          {results.safetyFactor.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Bulkhead Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resultados do Bulkhead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Espessura Necessária:</span>
                        <span className="font-mono font-semibold">{results.bulkheadThickness.toFixed(2)} mm</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Calculado para placa circular engastada com fator de segurança {targetSafetyFactor}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Screw Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resultados dos Parafusos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Número de Parafusos:</span>
                        <span className="font-mono font-semibold">{results.numScrews}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Força por Parafuso:</span>
                        <span className="font-mono">{results.screwForce.toFixed(2)} N</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tensão de Cisalhamento:</span>
                        <span className="font-mono">{results.screwShearStress.toFixed(2)} MPa</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Fator de Segurança:</span>
                        <span className={`font-mono font-semibold ${results.screwSafetyFactor >= 2 ? "text-green-600" : "text-yellow-600"}`}>
                          {results.screwSafetyFactor.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Nozzle Results */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Resultados da Tubeira</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Área da Garganta:</span>
                        <span className="font-mono">{results.throatArea.toFixed(2)} mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Área de Saída:</span>
                        <span className="font-mono">{results.exitArea.toFixed(2)} mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Razão de Expansão:</span>
                        <span className="font-mono">{results.expansionRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Diâmetro de Saída:</span>
                        <span className="font-mono font-semibold">{results.exitDiameter.toFixed(2)} mm</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!results && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <Cog className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Configure os parâmetros e clique em Calcular Dimensões</p>
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

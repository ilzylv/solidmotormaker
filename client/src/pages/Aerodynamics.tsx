import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wind, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface AeroResults {
  // Stability
  centerOfPressure: number;
  centerOfGravity: number;
  stabilityMargin: number;
  stabilityStatus: "stable" | "marginal" | "unstable";
  
  // Drag
  noseCd: number;
  bodyCd: number;
  finCd: number;
  totalCd: number;
  
  // Apogee
  apogee: number;
  maxVelocity: number;
  timeToApogee: number;
  
  // Recommendations
  recommendedNose: string;
  recommendedFinSpan: number;
  recommendedFinArea: number;
}

export default function Aerodynamics() {
  // Rocket parameters
  const [bodyDiameter, setBodyDiameter] = useState<string>("76.2");
  const [bodyLength, setBodyLength] = useState<string>("800");
  const [noseLength, setNoseLength] = useState<string>("200");
  const [noseType, setNoseType] = useState<string>("ogive");
  
  // Mass and CG
  const [dryMass, setDryMass] = useState<string>("1.5");
  const [propellantMass, setPropellantMass] = useState<string>("0.5");
  const [cgFromNose, setCgFromNose] = useState<string>("450");
  
  // Fins
  const [numFins, setNumFins] = useState<string>("3");
  const [finRootChord, setFinRootChord] = useState<string>("120");
  const [finTipChord, setFinTipChord] = useState<string>("60");
  const [finSpan, setFinSpan] = useState<string>("100");
  const [finSweep, setFinSweep] = useState<string>("30");
  
  // Motor
  const [avgThrust, setAvgThrust] = useState<string>("100");
  const [burnTime, setBurnTime] = useState<string>("2.5");
  
  const [results, setResults] = useState<AeroResults | null>(null);

  const calculate = () => {
    const D = parseFloat(bodyDiameter) / 1000; // mm to m
    const L_body = parseFloat(bodyLength) / 1000;
    const L_nose = parseFloat(noseLength) / 1000;
    const M_dry = parseFloat(dryMass);
    const M_prop = parseFloat(propellantMass);
    const CG = parseFloat(cgFromNose) / 1000;
    const N_fins = parseInt(numFins);
    const C_r = parseFloat(finRootChord) / 1000;
    const C_t = parseFloat(finTipChord) / 1000;
    const S = parseFloat(finSpan) / 1000;
    const sweep = parseFloat(finSweep) * Math.PI / 180;
    const F_avg = parseFloat(avgThrust);
    const t_burn = parseFloat(burnTime);

    // === STABILITY CALCULATIONS (Barrowman Method) ===
    
    // Nose cone CP
    const CP_nose = 0.466 * L_nose;
    
    // Body CP (at midpoint)
    const CP_body = L_nose + L_body / 2;
    
    // Fins CP (Barrowman equations)
    const X_fin = L_nose + L_body; // fin leading edge position
    const m = (C_t - C_r) / S; // taper
    const CP_fin = X_fin + (C_r / 3) * ((C_r + 2 * C_t) / (C_r + C_t)) + (1 / 6) * (C_r + C_t - C_r * C_t / (C_r + C_t));
    
    // Normal force coefficients (simplified)
    const CNa_nose = 2;
    const CNa_body = 0;
    const CNa_fins = (4 * N_fins * (S / D) ** 2) / (1 + Math.sqrt(1 + (2 * C_r / (C_r + C_t)) ** 2));
    
    // Total CP (weighted by normal force coefficients)
    const CP = (CNa_nose * CP_nose + CNa_body * CP_body + CNa_fins * CP_fin) / (CNa_nose + CNa_body + CNa_fins);
    
    // Stability margin (in calibers)
    const SM = (CP - CG) / D;
    
    let stability: "stable" | "marginal" | "unstable";
    if (SM >= 1 && SM <= 2) stability = "stable";
    else if (SM > 0.5 && SM < 3) stability = "marginal";
    else stability = "unstable";

    // === DRAG CALCULATIONS ===
    
    // Nose cone drag (depends on type)
    let Cd_nose = 0.5; // default
    switch (noseType) {
      case "conical": Cd_nose = 0.6; break;
      case "ogive": Cd_nose = 0.5; break;
      case "parabolic": Cd_nose = 0.45; break;
      case "elliptical": Cd_nose = 0.4; break;
    }
    
    // Body drag (skin friction + base)
    const Cd_body = 0.03 + 0.12; // friction + base drag
    
    // Fin drag
    const fin_area = N_fins * ((C_r + C_t) / 2) * S;
    const ref_area = Math.PI * (D / 2) ** 2;
    const Cd_fins = 0.02 * (fin_area / ref_area);
    
    // Total Cd
    const Cd_total = Cd_nose + Cd_body + Cd_fins;

    // === APOGEE SIMULATION ===
    
    const g = 9.8;
    const rho = 1.2;
    const A = Math.PI * (D / 2) ** 2;
    const k = 0.5 * rho * Cd_total * A;
    
    // Boost phase
    const M_initial = M_dry + M_prop;
    const q = Math.sqrt((F_avg - M_initial * g) / k);
    const x = (2 * k * q) / M_initial;
    const v_burnout = q * (1 - Math.exp(-x * t_burn)) / (1 + Math.exp(-x * t_burn));
    
    const yb = -(M_initial / (2 * k)) * Math.log((F_avg - M_initial * g - k * v_burnout ** 2) / (F_avg - M_initial * g));
    
    // Coast phase
    const M_final = M_dry;
    const yc = (M_final / (2 * k)) * Math.log((M_final * g + k * v_burnout ** 2) / (M_final * g));
    
    const h_apogee = yb + yc;
    const t_coast = (M_final / k) * (Math.atan(v_burnout * Math.sqrt(k / (M_final * g)))) / Math.sqrt(M_final * g * k);
    const t_apogee = t_burn + t_coast;

    // === RECOMMENDATIONS ===
    
    // Nose cone recommendation
    let recommended_nose = "Ogive";
    if (h_apogee > 2000) recommended_nose = "Von Kármán (baixo arrasto)";
    else if (h_apogee < 500) recommended_nose = "Cônico (simples)";
    
    // Fin recommendations
    const recommended_span = D * 1.3; // 1.3 calibers
    const recommended_area = (D ** 2) * 0.15; // 15% of reference area per fin

    setResults({
      centerOfPressure: CP * 1000,
      centerOfGravity: CG * 1000,
      stabilityMargin: SM,
      stabilityStatus: stability,
      noseCd: Cd_nose,
      bodyCd: Cd_body,
      finCd: Cd_fins,
      totalCd: Cd_total,
      apogee: h_apogee,
      maxVelocity: v_burnout,
      timeToApogee: t_apogee,
      recommendedNose: recommended_nose,
      recommendedFinSpan: recommended_span * 1000,
      recommendedFinArea: recommended_area * 1e6,
    });
  };

  return (
    <div className="container py-12 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 bg-chart-3 rounded-xl">
              <Wind className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Simulações Aerodinâmicas e Estabilidade
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simule a estabilidade, arrasto e apogeu do foguete completo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Corpo do Foguete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="body-diameter">Diâmetro (mm)</Label>
                  <Input
                    id="body-diameter"
                    type="number"
                    step="0.1"
                    value={bodyDiameter}
                    onChange={(e) => setBodyDiameter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body-length">Comprimento (mm)</Label>
                  <Input
                    id="body-length"
                    type="number"
                    step="1"
                    value={bodyLength}
                    onChange={(e) => setBodyLength(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Coifa (Nose Cone)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nose-length">Comprimento (mm)</Label>
                  <Input
                    id="nose-length"
                    type="number"
                    step="1"
                    value={noseLength}
                    onChange={(e) => setNoseLength(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nose-type">Tipo</Label>
                  <select
                    id="nose-type"
                    value={noseType}
                    onChange={(e) => setNoseType(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="conical">Cônico</option>
                    <option value="ogive">Ogive</option>
                    <option value="parabolic">Parabólico</option>
                    <option value="elliptical">Elíptico</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Massa e CG</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dry-mass">Massa Seca (kg)</Label>
                  <Input
                    id="dry-mass"
                    type="number"
                    step="0.1"
                    value={dryMass}
                    onChange={(e) => setDryMass(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-mass">Massa de Propelente (kg)</Label>
                  <Input
                    id="prop-mass"
                    type="number"
                    step="0.1"
                    value={propellantMass}
                    onChange={(e) => setPropellantMass(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cg">CG da Ponta (mm)</Label>
                  <Input
                    id="cg"
                    type="number"
                    step="1"
                    value={cgFromNose}
                    onChange={(e) => setCgFromNose(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Aletas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="num-fins">Número de Aletas</Label>
                  <Input
                    id="num-fins"
                    type="number"
                    min="3"
                    max="6"
                    value={numFins}
                    onChange={(e) => setNumFins(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="root-chord">Corda da Raiz (mm)</Label>
                  <Input
                    id="root-chord"
                    type="number"
                    step="1"
                    value={finRootChord}
                    onChange={(e) => setFinRootChord(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip-chord">Corda da Ponta (mm)</Label>
                  <Input
                    id="tip-chord"
                    type="number"
                    step="1"
                    value={finTipChord}
                    onChange={(e) => setFinTipChord(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="span">Envergadura (mm)</Label>
                  <Input
                    id="span"
                    type="number"
                    step="1"
                    value={finSpan}
                    onChange={(e) => setFinSpan(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sweep">Ângulo de Varredura (°)</Label>
                  <Input
                    id="sweep"
                    type="number"
                    step="1"
                    value={finSweep}
                    onChange={(e) => setFinSweep(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Motor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="avg-thrust">Empuxo Médio (N)</Label>
                  <Input
                    id="avg-thrust"
                    type="number"
                    step="1"
                    value={avgThrust}
                    onChange={(e) => setAvgThrust(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="burn-time">Tempo de Queima (s)</Label>
                  <Input
                    id="burn-time"
                    type="number"
                    step="0.1"
                    value={burnTime}
                    onChange={(e) => setBurnTime(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={calculate} className="w-full h-12 text-base" size="lg">
              <TrendingUp className="w-5 h-5 mr-2" />
              Simular Voo
            </Button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {results && (
              <>
                {/* Stability Alert */}
                <Alert variant={results.stabilityStatus === "stable" ? "default" : results.stabilityStatus === "marginal" ? "default" : "destructive"}>
                  {results.stabilityStatus === "stable" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {results.stabilityStatus === "stable" ? "Foguete Estável" :
                     results.stabilityStatus === "marginal" ? "Estabilidade Marginal" :
                     "ATENÇÃO: Foguete Instável"}
                  </AlertTitle>
                  <AlertDescription>
                    Margem de estabilidade: {results.stabilityMargin.toFixed(2)} calibres
                    {results.stabilityStatus === "stable" && " (Ideal: 1-2 calibres)"}
                    {results.stabilityStatus === "unstable" && " - Ajuste as aletas ou mova o CG!"}
                  </AlertDescription>
                </Alert>

                {/* Stability Diagram */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Diagrama de Estabilidade</CardTitle>
                    <CardDescription>Análise visual de CP e CG do foguete</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8 rounded-xl border-2">
                      <svg viewBox="0 0 1000 400" className="w-full h-auto">
                        <defs>
                          <linearGradient id="noseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9"/>
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6"/>
                          </linearGradient>
                          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.8"/>
                            <stop offset="50%" stopColor="hsl(var(--muted))" stopOpacity="0.5"/>
                            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.8"/>
                          </linearGradient>
                          <linearGradient id="finGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.8"/>
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.5"/>
                          </linearGradient>
                          <marker id="arrowStab" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                            <polygon points="0 0, 10 5, 0 10" fill="hsl(var(--primary))" />
                          </marker>
                          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.15"/>
                          </pattern>
                        </defs>
                        
                        {/* Background grid */}
                        <rect width="1000" height="400" fill="url(#gridPattern)" />
                        
                        {/* Centerline */}
                        <line x1="50" y1="200" x2="950" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="8,4" opacity="0.4" />
                        
                        {/* Nose Cone (ogive) */}
                        <path
                          d="M 100 200 Q 120 160, 180 150 L 180 250 Q 120 240, 100 200 Z"
                          fill="url(#noseGrad)"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2.5"
                        />
                        
                        {/* Body Tube */}
                        <rect
                          x="180"
                          y="150"
                          width="500"
                          height="100"
                          fill="url(#bodyGrad)"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2.5"
                          rx="2"
                        />
                        
                        {/* Motor section (darker) */}
                        <rect
                          x="580"
                          y="155"
                          width="100"
                          height="90"
                          fill="hsl(var(--primary))"
                          fillOpacity="0.3"
                          stroke="hsl(var(--primary))"
                          strokeWidth="1.5"
                          strokeDasharray="4,2"
                          rx="2"
                        />
                        
                        {/* Fins (3 visible) */}
                        {/* Fin 1 (top) */}
                        <path
                          d="M 620 150 L 720 120 L 720 150 Z"
                          fill="url(#finGrad)"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2.5"
                        />
                        {/* Fin 2 (bottom) */}
                        <path
                          d="M 620 250 L 720 280 L 720 250 Z"
                          fill="url(#finGrad)"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2.5"
                        />
                        {/* Fin 3 (side - perspective) */}
                        <ellipse
                          cx="670"
                          cy="200"
                          rx="50"
                          ry="8"
                          fill="url(#finGrad)"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2"
                          opacity="0.6"
                        />
                        
                        {/* Nozzle */}
                        <path
                          d="M 680 170 L 720 185 L 720 215 L 680 230 Z"
                          fill="hsl(var(--chart-3))"
                          stroke="hsl(var(--foreground))"
                          strokeWidth="2.5"
                        />
                        
                        {/* Exhaust plume */}
                        <ellipse cx="750" cy="200" rx="30" ry="20" fill="hsl(var(--chart-1))" opacity="0.3" />
                        <ellipse cx="770" cy="200" rx="25" ry="15" fill="hsl(var(--chart-1))" opacity="0.2" />
                        
                        {/* CG marker */}
                        <g>
                          <circle
                            cx={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            cy="200"
                            r="12"
                            fill="hsl(var(--chart-1))"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="3"
                          />
                          <line
                            x1={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y1="200"
                            x2={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y2="100"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth="2.5"
                            strokeDasharray="6,3"
                          />
                          <text
                            x={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y="85"
                            fill="hsl(var(--chart-1))"
                            fontSize="16"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            CG
                          </text>
                          <text
                            x={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y="75"
                            fill="hsl(var(--muted-foreground))"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            {results.centerOfGravity.toFixed(0)}mm
                          </text>
                        </g>
                        
                        {/* CP marker */}
                        <g>
                          <circle
                            cx={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            cy="200"
                            r="12"
                            fill="hsl(var(--chart-2))"
                            stroke="hsl(var(--foreground))"
                            strokeWidth="3"
                          />
                          <line
                            x1={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y1="200"
                            x2={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y2="300"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth="2.5"
                            strokeDasharray="6,3"
                          />
                          <text
                            x={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y="325"
                            fill="hsl(var(--chart-2))"
                            fontSize="16"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            CP
                          </text>
                          <text
                            x={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y="340"
                            fill="hsl(var(--muted-foreground))"
                            fontSize="11"
                            textAnchor="middle"
                          >
                            {results.centerOfPressure.toFixed(0)}mm
                          </text>
                        </g>
                        
                        {/* Stability margin indicator */}
                        <g>
                          <line
                            x1={180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y1="360"
                            x2={180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500}
                            y2="360"
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            markerEnd="url(#arrowStab)"
                            markerStart="url(#arrowStab)"
                          />
                          <rect
                            x={(180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500 + 
                                180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500) / 2 - 60}
                            y="345"
                            width="120"
                            height="30"
                            fill="hsl(var(--background))"
                            stroke="hsl(var(--primary))"
                            strokeWidth="2"
                            rx="6"
                          />
                          <text
                            x={(180 + (results.centerOfGravity / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500 + 
                                180 + (results.centerOfPressure / (parseFloat(bodyLength) + parseFloat(noseLength))) * 500) / 2}
                            y="365"
                            fill="hsl(var(--primary))"
                            fontSize="14"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {results.stabilityMargin.toFixed(2)} cal
                          </text>
                        </g>
                        
                        {/* Labels */}
                        <text x="140" y="130" fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle">Coifa</text>
                        <text x="430" y="135" fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle">Corpo</text>
                        <text x="630" y="135" fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle">Motor</text>
                        <text x="720" y="110" fill="hsl(var(--muted-foreground))" fontSize="12" textAnchor="middle">Aletas</text>
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Estabilidade</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Centro de Pressão (CP):</span>
                        <span className="font-mono">{results.centerOfPressure.toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Centro de Gravidade (CG):</span>
                        <span className="font-mono">{results.centerOfGravity.toFixed(1)} mm</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Margem de Estabilidade:</span>
                        <span className={`font-mono font-semibold ${results.stabilityStatus === "stable" ? "text-green-600" : results.stabilityStatus === "marginal" ? "text-yellow-600" : "text-red-600"}`}>
                          {results.stabilityMargin.toFixed(2)} cal
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Coeficiente de Arrasto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Coifa:</span>
                        <span className="font-mono">{results.noseCd.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Corpo:</span>
                        <span className="font-mono">{results.bodyCd.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aletas:</span>
                        <span className="font-mono">{results.finCd.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Total (Cd):</span>
                        <span className="font-mono font-semibold">{results.totalCd.toFixed(3)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2 border-primary">
                    <CardHeader>
                      <CardTitle className="text-base">Performance de Voo</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-accent/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Apogeu</p>
                        <p className="text-3xl font-bold text-accent">{results.apogee.toFixed(1)} m</p>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Velocidade Máxima</p>
                        <p className="text-3xl font-bold text-primary">{results.maxVelocity.toFixed(1)} m/s</p>
                      </div>
                      <div className="text-center p-4 bg-secondary/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Tempo até Apogeu</p>
                        <p className="text-3xl font-bold text-secondary-foreground">{results.timeToApogee.toFixed(1)} s</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Recomendações</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Coifa Recomendada:</p>
                        <p className="text-sm">{results.recommendedNose}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-semibold mb-1">Aletas Recomendadas:</p>
                        <p className="text-sm">
                          Envergadura: {results.recommendedFinSpan.toFixed(1)} mm
                          <br />
                          Área por aleta: {results.recommendedFinArea.toFixed(1)} mm²
                        </p>
                      </div>
                      {results.stabilityStatus !== "stable" && (
                        <div className="p-3 bg-accent/10 border border-accent rounded-lg">
                          <p className="text-sm font-semibold mb-1">Ajustes Necessários:</p>
                          <ul className="text-sm list-disc list-inside">
                            {results.stabilityMargin < 1 && <li>Aumentar área das aletas ou mover CG para frente</li>}
                            {results.stabilityMargin > 2 && <li>Reduzir área das aletas ou mover CG para trás</li>}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {!results && (
              <Card className="border-dashed">
                <CardContent className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <Wind className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Configure os parâmetros do foguete e clique em Simular Voo</p>
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

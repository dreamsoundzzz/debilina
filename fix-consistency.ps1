# Read the ExecutiveControl file
$content = Get-Content "src/ai/ExecutiveControl.js" -Raw

# Replace class name and documentation
$content = $content -replace 'ExecutiveControl', 'ConsistencyEngine'
$content = $content -replace 'Executive Control System \(Phase 2\.3\)', 'Consistency Engine System (Phase 2.4)'
$content = $content -replace 'Implements executive function and cognitive control for deliberate behavior\.', 'Implements coherence checking and contradiction resolution for mental state integrity.'
$content = $content -replace 'Enables the NPC to inhibit automatic responses, switch strategies, and exercise self-control\.', 'Ensures beliefs, goals, and actions form a logically consistent whole.'
$content = $content -replace 'Consciousness Impact: \+5% \(80% → 85%\)', 'Consciousness Impact: +5% (85% → 90%)'

# Replace the key features section
$content = $content -replace 'Response inhibition \("Don''t do that!"\)', 'Coherence checking across beliefs, goals, actions'
$content = $content -replace 'Strategy selection and switching', 'Contradiction detection (logical, semantic, temporal)'
$content = $content -replace 'Deliberate override of automatic responses', 'Automatic contradiction repair'
$content = $content -replace 'Impulse control', 'Logical consistency validation'
$content = $content -replace 'Conflict monitoring', 'Belief chain verification'

# Replace theoretical foundation
$content = $content -replace 'Executive Function Theory \(Diamond, Miyake\)', 'Belief Revision Theory (Gärdenfors, Alchourrón)'
$content = $content -replace 'Cognitive Control \(Miller & Cohen\)', 'Coherence Theory (Thagard)'
$content = $content -replace 'Dual Process Theory \(Kahneman\)', 'Cognitive Consistency Theory (Festinger)'

# Replace constructor content
$oldConstructor = @'
    constructor\(\) \{
        // Inhibition rules: conditions that trigger response inhibition
        this\.inhibitionRules = new Map\(\);
        
        // Active inhibitions
        this\.activeInhibitions = \[\];
        this\.maxInhibitionHistory = 50;
        
        // Strategy registry
        this\.strategies = new Map\(\);
        this\.activeStrategy = null;
        this\.strategyHistory = \[\];
        
        // Conflict monitoring
        this\.conflicts = \[\];
        this\.conflictThreshold = 0\.5;
        
        // Impulse control
        this\.impulseQueue = \[\];
        this\.impulseDelayMs = 500; // Delay before acting on impulse
        
        // Override tracking
        this\.overrides = \{
            total: 0,
            successful: 0,
            failed: 0
        \};
        
        // Initialize default rules and strategies
        this\.initializeDefaults\(\);
    \}
'@

$newConstructor = @'
    constructor() {
        // Consistency rules
        this.consistencyRules = new Map();
        
        // Detected inconsistencies
        this.inconsistencies = [];
        this.maxInconsistencyHistory = 50;
        
        // Repair history
        this.repairs = [];
        this.maxRepairHistory = 50;
        
        // Coherence scores
        this.coherenceScores = {
            beliefs: 1.0,
            goals: 1.0,
            actions: 1.0,
            overall: 1.0
        };
        
        // Consistency thresholds
        this.thresholds = {
            critical: 0.5,
            warning: 0.7,
            good: 0.9
        };
        
        // Initialize default rules
        this.initializeDefaultRules();
    }
'@

$content = $content -replace $oldConstructor, $newConstructor

# Write to ConsistencyEngine.js
$content | Set-Content "src/ai/ConsistencyEngine.js" -NoNewline

Write-Host "ConsistencyEngine.js has been updated!"

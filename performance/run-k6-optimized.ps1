$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$root = $PSScriptRoot
$resultsDir = Join-Path $root 'results'
$optimizedDir = Join-Path $resultsDir 'optimized'

New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null
New-Item -ItemType Directory -Force -Path $optimizedDir | Out-Null

function Invoke-K6Scenario {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [hashtable]$EnvMap
  )

  $summaryPath = Join-Path $optimizedDir "$Name-summary.json"
  $logPath = Join-Path $optimizedDir "$Name.txt"
  $envArgs = @()

  foreach ($key in $EnvMap.Keys) {
    $envArgs += '--env'
    $envArgs += "$key=$($EnvMap[$key])"
  }

  & k6 run $envArgs --summary-export $summaryPath $ScriptPath *> $logPath
}

Push-Location $projectRoot

Invoke-K6Scenario -Name 'read-heavy' -ScriptPath 'performance/k6/read-heavy.js' -EnvMap @{
  BASE_URL = 'http://localhost:3000'
  SCENARIO_RATE = '4'
  SCENARIO_DURATION = '1m'
}

Invoke-K6Scenario -Name 'write-heavy' -ScriptPath 'performance/k6/write-heavy.js' -EnvMap @{
  BASE_URL = 'http://localhost:3000'
  SCENARIO_RATE = '2'
  SCENARIO_DURATION = '1m'
  USER_COUNT = '25'
  USER_PREFIX = 'k6_write_optimized'
}

Invoke-K6Scenario -Name 'mixed' -ScriptPath 'performance/k6/mixed.js' -EnvMap @{
  BASE_URL = 'http://localhost:3000'
  SCENARIO_RATE = '3'
  SCENARIO_DURATION = '1m'
  USER_COUNT = '25'
  USER_PREFIX = 'k6_mixed_optimized'
}

Invoke-K6Scenario -Name 'spike' -ScriptPath 'performance/k6/spike.js' -EnvMap @{
  BASE_URL = 'http://localhost:3000'
  STAGE_ONE_RATE = '1'
  STAGE_TWO_RATE = '10'
  STAGE_THREE_RATE = '10'
  STAGE_FOUR_RATE = '1'
}

Invoke-K6Scenario -Name 'soak' -ScriptPath 'performance/k6/soak.js' -EnvMap @{
  BASE_URL = 'http://localhost:3000'
  SCENARIO_RATE = '2'
  SCENARIO_DURATION = '3m'
}

Pop-Location

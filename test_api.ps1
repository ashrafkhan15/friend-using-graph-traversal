$body = '{"users":["Alice","Bob","Charlie"],"connections":[{"from":"Alice","to":"Bob"},{"from":"Bob","to":"Charlie"}]}'
$resp = Invoke-RestMethod -Uri 'http://localhost:5000/build-graph' -Method POST -ContentType 'application/json' -Body $body
Write-Output "BUILD-GRAPH response:"
$resp | ConvertTo-Json

$body2 = '{"userName":"Alice"}'
$resp2 = Invoke-RestMethod -Uri 'http://localhost:5000/suggest-friends' -Method POST -ContentType 'application/json' -Body $body2
Write-Output "SUGGEST-FRIENDS response:"
$resp2 | ConvertTo-Json

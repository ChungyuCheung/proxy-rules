@echo off
chcp 65001 >nul
echo ============================================
echo  Add loopback exemption for Microsoft Store
echo ============================================
echo.
echo [1/3] Adding exemptions...
CheckNetIsolation LoopbackExempt -a -n=Microsoft.WindowsStore_8wekyb3d8bbwe
CheckNetIsolation LoopbackExempt -a -n=Microsoft.StorePurchaseApp_8wekyb3d8bbwe
CheckNetIsolation LoopbackExempt -a -n=windows.immersivecontrolpanel_cw5n1h2txyewy
echo.
echo [2/3] Current exemption list:
CheckNetIsolation LoopbackExempt -s
echo.
echo [3/3] Done. Fully close and reopen Microsoft Store.
echo.
pause

cp firefox_manifest.json manifest.json
zip -r versions/firefox_fieldfilter_$1.zip ./ -x "*.git*" -x "*versions*" -x "*_manifest.json" -x "build*"

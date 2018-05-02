if jq -e . >/dev/null 2>&1 <<<"$json_string"; then
    # Parsed JSON successfully and got something other than false/null
    echo $1 | jq -r '(.[0] | keys_unsorted) as $keys | map([.[ $keys[] ]])[] | @csv' >> log.txt
else
    echo "log.sh Failed to parse JSON"
    echo "log.sh $1"
fi


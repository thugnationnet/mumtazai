#!/bin/bash
# Creates Stripe products + prices at correct amounts for all agents
# Daily $5 | Weekly $7 | Monthly $30 | Yearly $300

SK="${STRIPE_SECRET_KEY:-}"
if [ -z "$SK" ]; then echo "ERROR: STRIPE_SECRET_KEY env var not set"; exit 1; fi
STRIPE_API="https://api.stripe.com/v1"
ENV_OUT="/tmp/stripe_new_prices.env"

> "$ENV_OUT"

AGENTS=(
  "comedy-king:Comedy King"
  "ben-sega:Ben Sega"
  "bishop-burger:Bishop Burger"
  "chef-biew:Chef Biew"
  "chess-player:Chess Player"
  "drama-queen:Drama Queen"
  "einstein:Einstein"
  "emma-emotional:Emma Emotional"
  "fitness-guru:Fitness Guru"
  "julie-girlfriend:Julie Girlfriend"
  "knight-logic:Knight Logic"
  "lazy-pawn:Lazy Pawn"
  "mrs-boss:Mrs Boss"
  "nid-gaming:Nid Gaming"
  "professor-astrology:Professor Astrology"
  "rook-jokey:Rook Jokey"
  "tech-wizard:Tech Wizard"
  "travel-buddy:Travel Buddy"
  "gencraft-pro:Gencraft Pro"
  "canvas-build:Canvas Build"
)

declare -A PLAN_AMOUNT=( [daily]=500 [weekly]=700 [monthly]=3000 [yearly]=30000 )
declare -A PLAN_LABEL=( [daily]="Daily" [weekly]="Weekly" [monthly]="Monthly" [yearly]="Yearly" )
declare -A PLAN_INTERVAL=( [daily]=day [weekly]=week [monthly]=month [yearly]=year )

create_product_and_price() {
  local slug="$1"   # e.g. emma-emotional
  local name="$2"   # e.g. Emma Emotional
  local plan="$3"   # daily | weekly | monthly | yearly

  local amount="${PLAN_AMOUNT[$plan]}"
  local label="${PLAN_LABEL[$plan]}"
  local interval="${PLAN_INTERVAL[$plan]}"
  local upper_slug=$(echo "$slug" | tr '[:lower:]' '[:upper:]')
  local upper_plan=$(echo "$plan" | tr '[:lower:]' '[:upper:]')
  local product_name="${name} - AI Agent Access (${label})"

  # Create product
  local prod_resp=$(curl -s -X POST "$STRIPE_API/products" \
    -u "$SK:" \
    -d "name=${product_name}" \
    -d "description=Access to ${name} AI agent on Mumtaz AI" \
    -d "metadata[agent]=${slug}" \
    -d "metadata[plan]=${plan}")

  local prod_id=$(echo "$prod_resp" | grep -o '"id": *"prod_[^"]*"' | head -1 | sed 's/"id": *"//;s/"//')
  if [ -z "$prod_id" ]; then
    echo "ERROR creating product for ${slug} ${plan}: $prod_resp"
    return 1
  fi

  # Create price (one_time, not recurring)
  local price_resp=$(curl -s -X POST "$STRIPE_API/prices" \
    -u "$SK:" \
    -d "unit_amount=${amount}" \
    -d "currency=usd" \
    -d "product=${prod_id}")

  local price_id=$(echo "$price_resp" | grep -o '"id": *"price_[^"]*"' | head -1 | sed 's/"id": *"//;s/"//')
  if [ -z "$price_id" ]; then
    echo "ERROR creating price for ${slug} ${plan}: $price_resp"
    return 1
  fi

  echo "STRIPE_PRODUCT_${upper_slug}_${upper_plan}=${prod_id}" >> "$ENV_OUT"
  echo "STRIPE_PRICE_${upper_slug}_${upper_plan}=${price_id}" >> "$ENV_OUT"
  echo "  ✓ ${slug} ${plan}: ${prod_id} / ${price_id}"
}

echo "Creating Stripe products and prices..."
for entry in "${AGENTS[@]}"; do
  slug="${entry%%:*}"
  name="${entry##*:}"
  echo "→ ${name}"
  for plan in daily weekly monthly yearly; do
    create_product_and_price "$slug" "$name" "$plan"
  done
done

# Add duplicates for canvas-build and gencraft-pro (underscore variants)
grep "CANVAS-BUILD" "$ENV_OUT" | sed 's/CANVAS-BUILD/CANVAS_BUILD/g' >> "$ENV_OUT"
grep "GENCRAFT-PRO" "$ENV_OUT" | sed 's/GENCRAFT-PRO/GENCRAFT_PRO/g' >> "$ENV_OUT"

# Also add bare product entry for gencraft-pro (no billing period suffix)
prod_id=$(grep "^STRIPE_PRODUCT_GENCRAFT-PRO_DAILY=" "$ENV_OUT" | cut -d= -f2)
price_id=$(grep "^STRIPE_PRICE_GENCRAFT-PRO_DAILY=" "$ENV_OUT" | cut -d= -f2)
echo "STRIPE_PRODUCT_GENCRAFT-PRO=${prod_id}" >> "$ENV_OUT"
echo "STRIPE_PRODUCT_CANVAS-BUILD=$(grep "^STRIPE_PRODUCT_CANVAS-BUILD_DAILY=" "$ENV_OUT" | cut -d= -f2)" >> "$ENV_OUT"
echo "STRIPE_PRODUCT_CANVAS_BUILD=$(grep "^STRIPE_PRODUCT_CANVAS-BUILD_DAILY=" "$ENV_OUT" | cut -d= -f2)" >> "$ENV_OUT"

echo ""
echo "Done! $(wc -l < "$ENV_OUT") entries written to $ENV_OUT"

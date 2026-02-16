from flask import Blueprint, jsonify
from sqlalchemy import func

from app.extensions import db
from app.models import Brand, Product
from app.services import ProductService
from app.utils.response_formatter import format_response

home_bp = Blueprint("home", __name__)


@home_bp.route("/", methods=["GET"])
def get_homepage_data():
    try:
        # 🔹 Trending (newest 10)
        trending = (
            Product.query.order_by(Product.created_at.desc()).limit(10).all()
        )

        # 🔹 Best deals (best sellers 8)
        best_deals = (
            Product.query.filter_by(isBestSeller=True).limit(8).all()
        )

        # 🔹 Brands with product count
        brands = (
            db.session.query(
                Brand.id,
                Brand.name,
                func.count(Product.id).label("product_count")
            )
            .outerjoin(Product, Product.brand_id == Brand.id)
            .group_by(Brand.id, Brand.name)
            .all()
        )

        # 🔹 Preload 5 products per brand
        brand_products_map = {}
        for brand in brands:
            products = (
                Product.query
                .filter(Product.brand_id == brand.id)
                .limit(5)
                .all()
            )
            brand_products_map[brand.id] = [
                ProductService._serialize_product(p) for p in products
            ]

        response = {
            "trending": [ProductService._serialize_product(p) for p in trending],
            "bestDeals": [ProductService._serialize_product(p) for p in best_deals],
            "brands": [
                {
                    "id": b.id,
                    "name": b.name,
                    "product_count": b.product_count,
                    "products": brand_products_map.get(b.id, [])
                }
                for b in brands
            ],
        }

        return jsonify(format_response(True, response, "Homepage data")), 200

    except Exception as e:
        return jsonify(format_response(False, None, str(e))), 500

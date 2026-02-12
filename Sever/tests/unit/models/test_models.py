import pytest

from app.models import Order, ProductVariation


def test_order_generate_reference_starts_at_001(db):
    assert Order.generate_order_reference() == "PHK-001"


def test_order_generate_reference_increments_with_existing_order(order):
    assert order.order_reference == "PHK-001"
    assert Order.generate_order_reference() == "PHK-002"


def test_product_variation_repr(product):
    variation = ProductVariation(product_id=product.id, ram="8GB", storage="256GB", price=99999)
    assert repr(variation) == "<ProductVariation 8GB/256GB>"

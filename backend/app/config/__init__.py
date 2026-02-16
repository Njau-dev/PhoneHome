"""Configuration loader"""
from .base import ENVIRONMENT
from .development import DevelopmentConfig
from .production import ProductionConfig
from .testing import TestingConfig


def get_config(config_name=None):
    """Get configuration based on environment"""
    if config_name is None:
        config_name = ENVIRONMENT

    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig,
        'default': DevelopmentConfig
    }

    print(f"Loading configuration for: {config_name}")
    return config_map.get(config_name, DevelopmentConfig)


# Export for easy access
Config = get_config()

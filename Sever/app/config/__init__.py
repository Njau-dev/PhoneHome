"""Configuration loader"""
import os
from .base import BaseConfig, ENVIRONMENT
from .development import DevelopmentConfig
from .production import ProductionConfig


def get_config(config_name=None):
    """Get configuration based on environment"""
    if config_name is None:
        config_name = ENVIRONMENT

    config_map = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'default': DevelopmentConfig
    }

    print(f"Loading configuration for: {config_name}")
    return config_map.get(config_name, DevelopmentConfig)


# Export for easy access
Config = get_config()

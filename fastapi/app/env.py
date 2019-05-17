from enum import Enum


class Env(str, Enum):
    """
    The various runtime environments that can used.
    """
    DEVELOPMENT = 'development'
    PRODUCTION = 'production'
    TEST = 'test'
    MIGRATE = 'migrate'

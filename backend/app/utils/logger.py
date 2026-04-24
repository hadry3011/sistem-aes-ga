import logging
import os
from datetime import datetime

# Pastikan direktori logs tersedia
LOG_DIR = os.path.join(os.getcwd(), 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

def setup_logger(name='aes_ga_app'):
    """
    Helper untuk setup logger yang mencatat ke console dan file.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Hindari duplikasi handler jika fungsi dipanggil ulang
    if logger.handlers:
        return logger

    # Format log: Timestamp - Level - Module - Message
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    )

    # 1. File Handler (Log ke file harian)
    log_filename = datetime.now().strftime('app_%Y-%m-%d.log')
    file_handler = logging.FileHandler(os.path.join(LOG_DIR, log_filename))
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)

    # 2. Console Handler (Log ke terminal)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# Singleton instance
app_logger = setup_logger()

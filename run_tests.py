import logging
from tests.test_audio import test_audio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_all_tests():
    logger.info("Starting tests...")
    
    # Run audio test
    logger.info("Running audio test...")
    if test_audio():
        logger.info("Audio test passed!")
    else:
        logger.error("Audio test failed!")

if __name__ == "__main__":
    run_all_tests()
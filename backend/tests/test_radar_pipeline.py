"""
Unit & Integration Tests for SkyShield AI Radar Processing Pipeline
Uses standard library unittest and FastAPI TestClient.
"""
import unittest
import numpy as np
from fastapi.testclient import TestClient

from app.db.database import init_db
from app.services.radar_simulator import radar_simulator
from app.services.signal_processor import signal_processor
from app.services.classifier import DemoClassifier, get_classifier
from app.main import app

class TestRadarPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_radar_simulator_generation(self):
        drone_sig = radar_simulator.generate_drone_signal(range_m=120.0, velocity_ms=10.0)
        self.assertEqual(len(drone_sig), 1024)
        self.assertFalse(np.isnan(drone_sig).any())
        
        bird_sig = radar_simulator.generate_bird_signal(range_m=80.0, velocity_ms=8.0)
        self.assertEqual(len(bird_sig), 1024)
        self.assertFalse(np.isnan(bird_sig).any())
        
        unknown_sig = radar_simulator.generate_unknown_signal(range_m=150.0, velocity_ms=2.0)
        self.assertEqual(len(unknown_sig), 1024)
        self.assertFalse(np.isnan(unknown_sig).any())

    def test_stft_signal_processing(self):
        sig, meta = radar_simulator.acquire_frame(target_type_hint="drone")
        f, t, spec_db, spec_norm = signal_processor.compute_stft(sig)
        
        self.assertTrue(len(f) > 0)
        self.assertTrue(len(t) > 0)
        self.assertEqual(spec_norm.shape[0], len(f))
        self.assertEqual(spec_norm.shape[1], len(t))
        self.assertGreaterEqual(float(np.min(spec_norm)), 0.0)
        self.assertLessEqual(float(np.max(spec_norm)), 1.0001)

    def test_feature_extraction(self):
        sig, meta = radar_simulator.acquire_frame(target_type_hint="drone")
        f, t, spec_db, spec_norm = signal_processor.compute_stft(sig)
        feats = signal_processor.extract_features(f, t, spec_norm, sig)
        
        self.assertIn("spectral_centroid_hz", feats)
        self.assertIn("spectral_bandwidth_hz", feats)
        self.assertIn("harmonic_energy_ratio", feats)
        self.assertIn("modulation_frequency_hz", feats)
        self.assertIn("peak_doppler_spread_hz", feats)

    def test_classifier_probabilities(self):
        classifier = DemoClassifier()
        sig, meta = radar_simulator.acquire_frame(target_type_hint="drone")
        f, t, spec_db, spec_norm = signal_processor.compute_stft(sig)
        feats = signal_processor.extract_features(f, t, spec_norm, sig)
        
        res = classifier.classify(spec_norm, feats, meta)
        self.assertIn(res["prediction"], ["DRONE", "BIRD", "UNKNOWN"])
        self.assertGreaterEqual(res["confidence"], 0.0)
        self.assertLessEqual(res["confidence"], 1.0)
        probs = res["probabilities"]
        prob_sum = probs["drone"] + probs["bird"] + probs["unknown"]
        self.assertAlmostEqual(prob_sum, 1.0, places=2)

    def test_api_health(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_api_system_status(self):
        response = self.client.get("/api/system/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("radar", data)
        self.assertIn("ai_model", data)
        self.assertEqual(data["mode_banner"], "SIMULATION MODE – DATA IS SYNTHETIC")

    def test_api_analyze(self):
        response = self.client.post("/api/analyze", json={"target_type_hint": "drone"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn(data["classification"], ["DRONE", "BIRD", "UNKNOWN"])
        self.assertIn("spectrogram", data)

    def test_api_statistics(self):
        response = self.client.get("/api/statistics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_detections", data)
        self.assertGreaterEqual(data["total_detections"], 1)

    def test_api_model_info(self):
        response = self.client.get("/api/model/info")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["classes"], ["DRONE", "BIRD", "UNKNOWN"])

if __name__ == "__main__":
    unittest.main()
